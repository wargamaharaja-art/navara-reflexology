import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, financeTransactions, journalEntries, journalLines, branches, settings, customerFeedbacks } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logSystemAction } from "@/lib/logger";
import { getSession } from "@/lib/auth";
import { ensureFeedbackTable } from "@/lib/db/feedback-init";
import crypto from "crypto";

// GET: Public endpoint - fetch invoice detail by ID (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFeedbackTable();
    const { id } = await params;

    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Struk tidak ditemukan" }, { status: 404 });
    }

    const invoice = result[0];

    const branchResult = await db.select({
      mapUrl: branches.mapUrl,
      whatsappNumber: branches.whatsappNumber
    }).from(branches).where(eq(branches.id, invoice.branchId)).limit(1);

    const settingsResult = await db.select({
      mapUrl: settings.mapUrl,
      whatsappNumber: settings.whatsappNumber
    }).from(settings).where(eq(settings.id, "company_info")).limit(1);

    // Check or create feedback token for this invoice
    let feedbackToken = "";
    const feedbackList = await db
      .select({ token: customerFeedbacks.token })
      .from(customerFeedbacks)
      .where(eq(customerFeedbacks.invoiceId, invoice.id))
      .limit(1);

    if (feedbackList.length > 0) {
      feedbackToken = feedbackList[0].token;
    } else {
      feedbackToken = crypto.randomBytes(6).toString("hex");
      try {
        await db.insert(customerFeedbacks).values({
          id: crypto.randomUUID(),
          token: feedbackToken,
          branchId: invoice.branchId,
          therapistId: invoice.therapistId || null,
          visitId: invoice.visitId || null,
          invoiceId: invoice.id,
          customerName: invoice.patientName,
          customerPhone: invoice.patientPhone,
          status: "PENDING",
        });
      } catch (fbErr) {
        console.error("Failed to auto-create feedback record:", fbErr);
      }
    }

    return NextResponse.json({
      data: {
        ...invoice,
        items: JSON.parse(invoice.items),
        branchMapUrl: branchResult[0]?.mapUrl || settingsResult[0]?.mapUrl || "",
        branchWhatsapp: branchResult[0]?.whatsappNumber || settingsResult[0]?.whatsappNumber || "",
        feedbackToken,
        feedbackUrl: `/feedback/${feedbackToken}`,
      }
    });
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat struk" }, { status: 500 });
  }
}

// PUT: Edit an existing invoice (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing invoice
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Struk tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const {
      paymentMethod,
      amountPaid,
      discount,
      tax,
      notes,
      patientName,
      patientPhone,
      therapistName,
    } = body;

    const current = existing[0];

    // Recalculate totals if discount/tax changed
    const newDiscount = discount !== undefined ? Number(discount) : current.discount;
    const newTax = tax !== undefined ? Number(tax) : current.tax;
    const newGrandTotal = current.subtotal - newDiscount + newTax;
    const newAmountPaid = amountPaid !== undefined ? Number(amountPaid) : current.amountPaid;
    const newChangeAmount = Math.max(0, newAmountPaid - newGrandTotal);

    const updateData: Record<string, unknown> = {
      paymentMethod: paymentMethod || current.paymentMethod,
      amountPaid: newAmountPaid,
      changeAmount: newChangeAmount,
      discount: newDiscount,
      tax: newTax,
      grandTotal: newGrandTotal,
      notes: notes !== undefined ? notes : current.notes,
      patientName: patientName || current.patientName,
      patientPhone: patientPhone || current.patientPhone,
      therapistName: therapistName !== undefined ? therapistName : current.therapistName,
    };

    await db.update(invoices).set(updateData).where(eq(invoices.id, id));

    // Update linked finance transactions if paymentMethod or grandTotal changed
    const finUpdateData: Record<string, unknown> = {};
    if (paymentMethod && paymentMethod !== current.paymentMethod) {
      finUpdateData.paymentMethod = paymentMethod;
    }
    if (newGrandTotal !== current.grandTotal) {
      finUpdateData.amount = newGrandTotal;
    }
    if (Object.keys(finUpdateData).length > 0) {
      await db
        .update(financeTransactions)
        .set(finUpdateData)
        .where(eq(financeTransactions.referenceId, current.id));
    }

    // Fetch updated invoice
    const updated = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);

    return NextResponse.json({
      success: true,
      data: {
        ...updated[0],
        items: JSON.parse(updated[0].items),
      },
    });
  } catch (error) {
    console.error("PUT /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Gagal mengupdate struk" }, { status: 500 });
  }
}

// DELETE: Delete an existing invoice and its linked finance transaction (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if invoice exists
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Struk tidak ditemukan" }, { status: 404 });
    }

    // Delete linked journal entries and lines first
    const relatedFinTxs = await db.select({ id: financeTransactions.id })
      .from(financeTransactions)
      .where(eq(financeTransactions.referenceId, existing[0].id));
    const finTxIds = relatedFinTxs.map(tx => tx.id);

    if (finTxIds.length > 0) {
      const relatedJournals = await db.select({ id: journalEntries.id })
        .from(journalEntries)
        .where(inArray(journalEntries.referenceId, finTxIds));
      const journalIds = relatedJournals.map(j => j.id);

      if (journalIds.length > 0) {
        await db.delete(journalLines).where(inArray(journalLines.entryId, journalIds));
        await db.delete(journalEntries).where(inArray(journalEntries.id, journalIds));
      }

      await db.delete(financeTransactions).where(inArray(financeTransactions.id, finTxIds));
    }

    // Delete the invoice
    await db.delete(invoices).where(eq(invoices.id, id));

    await logSystemAction("DELETE_INVOICE", "invoice", id, `Struk dihapus: ${existing[0].invoiceNumber} - ${existing[0].patientName} (${existing[0].grandTotal})`);

    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
