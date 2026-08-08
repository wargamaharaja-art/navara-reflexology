import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  invoices,
  branches,
  patients,
  therapists,
  services,
  patientVisits,
} from "@/lib/db/schema";
import { eq, and, like, desc, inArray, gte, lte } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";
import { createJournalEntry, COA } from "@/lib/accounting";
import { financeTransactions, therapistCommissions, therapistServiceCommissions, therapistMonthlyReports } from "@/lib/db/schema";
import { calculateTherapistCommission } from "@/lib/commission";
import crypto from "crypto";

// Helper: Generate invoice number format INV-BRANCH_CODE-YYYYMMDD-SEQ
async function generateInvoiceNumber(branchId: string, tx?: any): Promise<string> {
  const now = new Date();
  const dateStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(/-/g, "");

  // Get branch code (first 3 letters uppercase)
  const dbInstance = tx || db;
  const branchRecords = await dbInstance.select().from(branches).where(eq(branches.id, branchId)).limit(1);
  const branchCode = branchRecords.length > 0
    ? branchRecords[0].name.substring(0, 3).toUpperCase()
    : branchId.substring(0, 3).toUpperCase();

  const prefix = `INV-${branchCode}-${dateStr}`;

  // Find the latest invoice with this prefix to get the next sequence
  const existing = await dbInstance
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const branchFilter = await getActiveBranchFilter();

    const conditions = [];
    if (branchFilter) {
      conditions.push(eq(invoices.branchId, branchFilter));
    }
    
    if (startDate) {
      const startObj = new Date(startDate);
      startObj.setHours(0, 0, 0, 0);
      conditions.push(gte(invoices.createdAt, startObj.toISOString()));
    }
    if (endDate) {
      const endObj = new Date(endDate);
      endObj.setHours(23, 59, 59, 999);
      conditions.push(lte(invoices.createdAt, endObj.toISOString()));
    }
    
    if (!startDate && !endDate && dateParam) {
      // Match invoices created on this date (createdAt starts with dateParam)
      conditions.push(like(invoices.createdAt, `${dateParam}%`));
    }

    const result = await db
      .select({
        invoice: invoices,
        patientGender: patients.gender
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt));

    const formatted = result.map(r => ({
      ...r.invoice,
      patientGender: r.patientGender
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    if (error.message === "Cabang tidak ditemukan") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
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
      splitPayments = null,
      amountPaid = 0,
      notes,
      // If linking to an existing visit
      visitId,
      visitIds,
    } = body;

    if (!patientPhone || !patientName || !branchId || !items || items.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Enforce branch context for branch admin
    const finalBranchId = (session.role !== "SUPER_ADMIN" && session.role !== "INVESTOR") ? session.branchId : branchId;
    if (!finalBranchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan" }, { status: 400 });
    }

    const txResult = await db.transaction(async (tx) => {
      // 1. Upsert patient
      let patientId = "";
      const existingPatient = await tx.select().from(patients).where(eq(patients.phone, patientPhone)).limit(1);
  
      if (existingPatient.length > 0) {
        patientId = existingPatient[0].id;
        // Update name if changed
        if (existingPatient[0].name !== patientName) {
          await tx.update(patients)
            .set({ name: patientName, updatedAt: new Date().toISOString() })
            .where(eq(patients.id, patientId));
        }
      } else {
        patientId = `P-${Date.now()}`;
        await tx.insert(patients).values({
          id: patientId,
          name: patientName,
          phone: patientPhone,
          address: patientAddress || null,
          gender: patientGender || null,
        });
      }
  
      // 2. Get branch info
      const branchRecords = await tx.select().from(branches).where(eq(branches.id, finalBranchId)).limit(1);
      const branch = branchRecords[0];
      if (!branch) {
        throw new Error("Cabang tidak ditemukan");
      }
  
      // 3. Get therapist info
      let therapistName = null;
      if (therapistId) {
        const therapistRecords = await tx.select().from(therapists).where(eq(therapists.id, therapistId)).limit(1);
        if (therapistRecords.length > 0) {
          therapistName = therapistRecords[0].name;
        }
      }
  
      // 4. Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || item.price * item.qty), 0);
      // Auto-calculate tax based on branch tax rate
      const branchTaxRate = branch.taxRate || 0;
      const calculatedTax = branchTaxRate > 0 ? Math.round(subtotal * branchTaxRate / 100) : (tax || 0);
      const grandTotal = subtotal - discount + calculatedTax;
  
      // 5. Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(finalBranchId, tx);
  
      // 6. Resolve Transaction Date
      let transactionDate = new Date().toISOString();
      let visitDateStr = transactionDate.split("T")[0]; // default to today
  
      if (visitId) {
        const existingVisits = await tx.select().from(patientVisits).where(eq(patientVisits.id, visitId)).limit(1);
        if (existingVisits.length > 0) {
          visitDateStr = existingVisits[0].visitDate;
          // Gunakan tanggal dari kunjungan, tapi pertahankan waktu saat ini agar tidak error timezone/format
          const timePart = transactionDate.split("T")[1];
          transactionDate = `${visitDateStr}T${timePart}`;
        }
      } else if (body.transactionDate) {
        transactionDate = body.transactionDate;
        visitDateStr = transactionDate.split("T")[0];
      }
  
      // Jika ini adalah pembayaran untuk visitId yang sudah ada, hapus invoice lamanya dulu
      // Ini mencegah duplikasi data jika kasir memproses ulang tagihan yang sama
      if (visitId) {
        await tx.delete(invoices).where(eq(invoices.visitId, visitId));
      }

      const invoiceId = crypto.randomUUID();
      const now = transactionDate; // Gunakan transactionDate sebagai acuan waktu
  
  
      await tx.insert(invoices).values({
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
        tax: calculatedTax,
        grandTotal,
        paymentMethod: splitPayments && splitPayments.length > 1 ? "SPLIT" : paymentMethod,
        splitPayments: splitPayments ? JSON.stringify(splitPayments) : null,
        amountPaid: amountPaid || grandTotal,
        changeAmount: Math.max(0, (amountPaid || grandTotal) - grandTotal),
        notes: notes || null,
        createdAt: now,
      });
  
      // 7. Create finance transaction (INCOME)
      if (splitPayments && splitPayments.length > 1) {
        let remainingChange = Math.max(0, (amountPaid || grandTotal) - grandTotal);
        
        for (const sp of splitPayments) {
          if (sp.amount <= 0) continue;
          
          let actualAmount = sp.amount;
          if (remainingChange > 0) {
             if (sp.method === 'CASH') {
                const deduct = Math.min(actualAmount, remainingChange);
                actualAmount -= deduct;
                remainingChange -= deduct;
             } else if (sp === splitPayments[splitPayments.length - 1]) {
                // If it's the last item and still have change (e.g. no CASH method), just deduct from here to balance it
                actualAmount -= remainingChange;
                remainingChange = 0;
             }
          }
          if (actualAmount <= 0) continue;

          const finTrxId = crypto.randomUUID();
          await tx.insert(financeTransactions).values({
            id: finTrxId,
            type: "INCOME",
            category: "Pendapatan Layanan",
            amount: actualAmount,
            description: `Struk ${invoiceNumber} - ${patientName} (${sp.method})`,
            referenceId: invoiceId,
            branchId: finalBranchId,
            paymentMethod: sp.method,
            date: now,
          });
  
          // 8. Create journal entry
          await createJournalEntry({
            date: now,
            description: `[POS] ${invoiceNumber} - ${patientName} (${sp.method})`,
            referenceId: finTrxId,
            debitAccountId: COA.KAS,
            creditAccountId: COA.PENDAPATAN_LAYANAN,
            amount: actualAmount,
          tx});
        }
      } else {
        const finTrxId = crypto.randomUUID();
        await tx.insert(financeTransactions).values({
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
        tx});
      }
  
      // 9. Sync patientVisits with POS items
      // Kita HANYA memperbarui visit original. Item tambahan dicatat di struk (invoices), tidak dibuat visit baru agar tidak double.
      const visitsToMark = visitIds && visitIds.length > 0 ? visitIds : (visitId ? [visitId] : []);
      const primaryVisitId = visitsToMark[0] || (visitId ? visitId : null);
      
      if (visitsToMark.length > 0) {
        await tx.update(patientVisits)
          .set({ 
            status: "completed",
            paymentStatus: "PAID", 
            updatedAt: now,
            ...(therapistId && { therapistId })
          })
          .where(inArray(patientVisits.id, visitsToMark));
      }

      // 10. Create therapist commission if applicable
      if (therapistId && visitsToMark.length > 0) {
        const therapistRecords = await tx.select().from(therapists).where(eq(therapists.id, therapistId)).limit(1);
        if (therapistRecords.length > 0) {
          const therapist = therapistRecords[0];
  
          let totalCommission = 0;
          let commissionDetails = [];
          
          const visitsInCart = await tx.select().from(patientVisits).where(inArray(patientVisits.id, visitsToMark));
          const handledVisitIds = new Set();
          const commissionPerVisit = new Map();

          // Calculate TOTAL commission for ALL items and distribute to visits
          for (const item of items) {
            const serviceId = item.serviceId;
            if (!serviceId) continue;
  
            const itemCommission = await calculateTherapistCommission(
              tx,
              therapistId,
              serviceId,
              item.qty || 1
            );
            if (itemCommission > 0) {
              totalCommission += itemCommission;
              commissionDetails.push(item.name || serviceId);
              
              let targetVisitId = primaryVisitId;
              const matchingVisit = visitsInCart.find(v => v.serviceId === serviceId && !handledVisitIds.has(v.id));
              
              if (matchingVisit) {
                targetVisitId = matchingVisit.id;
                handledVisitIds.add(matchingVisit.id);
              }
              
              if (targetVisitId) {
                const current = commissionPerVisit.get(targetVisitId) || 0;
                commissionPerVisit.set(targetVisitId, current + itemCommission);
              }
            }
          }

          if (totalCommission > 0) {
            // Hapus komisi lama jika ada untuk mencegah duplikasi
            await tx.delete(therapistCommissions).where(inArray(therapistCommissions.visitId, visitsToMark));
            await tx.delete(financeTransactions).where(
              and(
                inArray(financeTransactions.referenceId, visitsToMark),
                eq(financeTransactions.type, "EXPENSE"),
                like(financeTransactions.description, "%Bagi Hasil Terapis%")
              )
            );

            // Insert new commission for each visit
            for (const [vId, amount] of commissionPerVisit.entries()) {
              await tx.insert(therapistCommissions).values({
                id: crypto.randomUUID(),
                therapistId,
                visitId: vId,
                amount: amount,
                status: "PAID",
                paidAt: now,
              });
            }
  
            // Langsung catat komisi sebagai pengeluaran / beban di sistem keuangan
            const commTrxId = crypto.randomUUID();
            await tx.insert(financeTransactions).values({
              id: commTrxId,
              type: "EXPENSE",
              category: "Bagi Hasil Terapis",
              amount: totalCommission,
              description: `Bagi Hasil Terapis (${therapist.name}) untuk layanan ${commissionDetails.join(', ')} pasien ${patientName}`,
              referenceId: primaryVisitId,
              branchId: finalBranchId,
              paymentMethod: "CASH", // Asumsi disisihkan via kas
              date: now
            });
  
            // Otomatisasi Jurnal (Debet: Beban Komisi, Kredit: Kas)
            await createJournalEntry({
              date: now,
              description: `[Auto] Beban Bagi Hasil Terapis: ${therapist.name} - ${commissionDetails.join(', ')}`,
              referenceId: commTrxId,
              debitAccountId: COA.BEBAN_KOMISI,
              creditAccountId: COA.HUTANG_KOMISI, // Sesuai aturan yang ada sebelumnya
              amount: totalCommission, tx});
          }
        }
      }

  
        return {
        id: invoiceId,
        invoiceNumber,
        grandTotal,
        changeAmount: Math.max(0, (amountPaid || grandTotal) - grandTotal),
      };
    });

    return NextResponse.json({
      success: true,
      data: txResult
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: "Gagal membuat struk" }, { status: 500 });
  }
}
