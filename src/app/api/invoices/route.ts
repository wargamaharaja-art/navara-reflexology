import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, branches, patients, therapists, services, patientVisits } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";
import { getServicePrice, SERVICES_LIST } from "@/lib/pricing";
import { createJournalEntry, COA } from "@/lib/accounting";
import { financeTransactions, therapistCommissions, therapistServiceCommissions } from "@/lib/db/schema";
import crypto from "crypto";

// Helper: Generate invoice number format INV-BRANCH_CODE-YYYYMMDD-SEQ
async function generateInvoiceNumber(branchId: string): Promise<string> {
  const now = new Date();
  const dateStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(/-/g, "");
  
  // Get branch code (first 3 letters uppercase)
  const branchRecords = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1);
  const branchCode = branchRecords.length > 0 
    ? branchRecords[0].name.substring(0, 3).toUpperCase() 
    : branchId.substring(0, 3).toUpperCase();

  const prefix = `INV-${branchCode}-${dateStr}`;
  
  // Find the latest invoice with this prefix to get the next sequence
  const existing = await db
    .select()
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`))
    .orderBy(desc(invoices.invoiceNumber));

  let seq = 1;
  if (existing.length > 0) {
    const lastNum = existing[0].invoiceNumber;
    const lastSeq = parseInt(lastNum.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(3, "0")}`;
}

// GET: List invoices by date and/or branch
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const branchFilter = await getActiveBranchFilter();

    const conditions = [];
    if (branchFilter) {
      conditions.push(eq(invoices.branchId, branchFilter));
    }
    if (dateParam) {
      // Match invoices created on this date (createdAt starts with dateParam)
      conditions.push(like(invoices.createdAt, `${dateParam}%`));
    }

    const result = await db
      .select()
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ error: "Gagal memuat data struk" }, { status: 500 });
  }
}

// POST: Create a new invoice (POS transaction)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientPhone,
      patientName,
      patientAddress,
      patientGender,
      branchId,
      therapistId,
      items, // Array of {serviceId, name, qty, price, subtotal}
      discount = 0,
      tax = 0,
      paymentMethod = "CASH",
      amountPaid = 0,
      notes,
      // If linking to an existing visit
      visitId,
    } = body;

    if (!patientPhone || !patientName || !branchId || !items || items.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Enforce branch context for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : branchId;
    if (!finalBranchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan" }, { status: 400 });
    }

    // 1. Upsert patient
    let patientId = "";
    const existingPatient = await db.select().from(patients).where(eq(patients.phone, patientPhone)).limit(1);

    if (existingPatient.length > 0) {
      patientId = existingPatient[0].id;
      // Update name if changed
      if (existingPatient[0].name !== patientName) {
        await db.update(patients)
          .set({ name: patientName, updatedAt: new Date().toISOString() })
          .where(eq(patients.id, patientId));
      }
    } else {
      patientId = `P-${Date.now()}`;
      await db.insert(patients).values({
        id: patientId,
        name: patientName,
        phone: patientPhone,
        address: patientAddress || null,
        gender: patientGender || null,
      });
    }

    // 2. Get branch info
    const branchRecords = await db.select().from(branches).where(eq(branches.id, finalBranchId)).limit(1);
    const branch = branchRecords[0];
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
    }

    // 3. Get therapist info
    let therapistName = null;
    if (therapistId) {
      const therapistRecords = await db.select().from(therapists).where(eq(therapists.id, therapistId)).limit(1);
      if (therapistRecords.length > 0) {
        therapistName = therapistRecords[0].name;
      }
    }

    // 4. Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || item.price * item.qty), 0);
    const grandTotal = subtotal - discount + tax;

    // 5. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(finalBranchId);

    // 6. Create the invoice
    const invoiceId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(invoices).values({
      id: invoiceId,
      invoiceNumber,
      visitId: visitId || null,
      patientId,
      patientName,
      patientPhone,
      therapistId: therapistId || null,
      therapistName,
      branchId: finalBranchId,
      branchName: branch.name,
      branchAddress: branch.address,
      branchPhone: branch.phone,
      items: JSON.stringify(items),
      subtotal,
      discount,
      tax,
      grandTotal,
      paymentMethod,
      amountPaid: amountPaid || grandTotal,
      changeAmount: Math.max(0, (amountPaid || grandTotal) - grandTotal),
      notes: notes || null,
      createdAt: now,
    });

    // 7. Create finance transaction (INCOME)
    const finTrxId = crypto.randomUUID();
    await db.insert(financeTransactions).values({
      id: finTrxId,
      type: "INCOME",
      category: "Pendapatan Layanan",
      amount: grandTotal,
      description: `Struk ${invoiceNumber} - ${patientName}`,
      referenceId: invoiceId,
      branchId: finalBranchId,
      paymentMethod,
      date: now,
    });

    // 8. Create journal entry
    await createJournalEntry({
      date: now,
      description: `[POS] ${invoiceNumber} - ${patientName}`,
      referenceId: finTrxId,
      debitAccountId: COA.KAS,
      creditAccountId: COA.PENDAPATAN_LAYANAN,
      amount: grandTotal,
    });

    // 9. Create patient visit record if not linked to an existing one (POS standalone)
    let finalVisitId = visitId || null;
    if (!finalVisitId && items.length > 0) {
      // Create a patient visit for the first service item so commissions can be tracked
      const primaryItem = items[0];
      finalVisitId = `V-${Date.now()}`;
      await db.insert(patientVisits).values({
        id: finalVisitId,
        patientId,
        serviceId: primaryItem.serviceId || primaryItem.name,
        branchId: finalBranchId,
        therapistId: therapistId || null,
        visitDate: now.split("T")[0],
        visitTime: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }),
        notes: `POS Struk ${invoiceNumber}`,
        status: "completed",
        paymentStatus: "PAID",
      });
    }

    // 10. Create therapist commission if applicable
    if (therapistId && finalVisitId) {
      const therapistRecords = await db.select().from(therapists).where(eq(therapists.id, therapistId)).limit(1);
      if (therapistRecords.length > 0) {
        const therapist = therapistRecords[0];
        
        // Calculate commission for each item
        for (const item of items) {
          const serviceId = item.serviceId;
          if (!serviceId) continue;

          const customOverride = await db
            .select()
            .from(therapistServiceCommissions)
            .where(
              and(
                eq(therapistServiceCommissions.therapistId, therapistId),
                eq(therapistServiceCommissions.serviceId, serviceId)
              )
            )
            .limit(1);

          let commissionAmount = 0;
          if (customOverride.length > 0 && customOverride[0].commissionAmount !== null) {
            commissionAmount = customOverride[0].commissionAmount * (item.qty || 1);
          }

          if (commissionAmount > 0) {
            await db.insert(therapistCommissions).values({
              id: crypto.randomUUID(),
              therapistId,
              visitId: finalVisitId,
              amount: commissionAmount,
              status: "PENDING",
            });

            // Langsung catat komisi sebagai pengeluaran / beban di sistem keuangan
            const commTrxId = crypto.randomUUID();
            await db.insert(financeTransactions).values({
              id: commTrxId,
              type: "EXPENSE",
              category: "Bagi Hasil Terapis",
              amount: commissionAmount,
              description: `Bagi Hasil Terapis (${therapist.name}) untuk layanan ${item.name || serviceId} pasien ${patientName}`,
              referenceId: finalVisitId,
              branchId: finalBranchId,
              paymentMethod: "CASH", // Asumsi disisihkan via kas
              date: now
            });

            // Otomatisasi Jurnal (Debet: Beban Komisi, Kredit: Kas)
            await createJournalEntry({
              date: now,
              description: `[Auto] Beban Bagi Hasil Terapis: ${therapist.name} - ${item.name || serviceId}`,
              referenceId: commTrxId,
              debitAccountId: COA.BEBAN_KOMISI,
              creditAccountId: COA.KAS,
              amount: commissionAmount
            });
          }
        }
      }
    }

    // 11. If existing visit was provided, mark as PAID
    if (visitId) {
      await db.update(patientVisits)
        .set({ paymentStatus: "PAID", updatedAt: now })
        .where(eq(patientVisits.id, visitId));
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invoiceId,
        invoiceNumber,
        grandTotal,
        changeAmount: Math.max(0, (amountPaid || grandTotal) - grandTotal),
      }
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: "Gagal membuat struk" }, { status: 500 });
  }
}
