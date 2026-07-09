import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, financeTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logSystemAction } from "@/lib/logger";
import { getSession } from "@/lib/auth";

// GET: Public endpoint - fetch invoice detail by ID (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    return NextResponse.json({
      data: {
        ...invoice,
        items: JSON.parse(invoice.items),
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

    // Also update the linked finance transaction's paymentMethod if it changed
    if (paymentMethod && paymentMethod !== current.paymentMethod) {
      await db
        .update(financeTransactions)
        .set({ paymentMethod })
        .where(eq(financeTransactions.referenceId, id));
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

    // Delete the linked finance transaction first (foreign key safety)
    await db.delete(financeTransactions).where(eq(financeTransactions.referenceId, id));

    // Delete the invoice
    await db.delete(invoices).where(eq(invoices.id, id));

    await logSystemAction("DELETE_INVOICE", "invoice", id, `Struk dihapus: ${existing[0].invoiceNumber} - ${existing[0].patientName} (${existing[0].grandTotal})`);

    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
