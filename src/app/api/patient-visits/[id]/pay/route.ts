import { db } from "@/lib/db";
import { patientVisits, financeTransactions, therapists, therapistCommissions, patients, therapistServiceCommissions, invoices, branches, therapistMonthlyReports, services } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { createJournalEntry, COA } from "@/lib/accounting";
import { checkBranchAccess, getSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: visitId } = await params;
    const body = await request.json();
    const { paymentMethod } = body;

    if (!paymentMethod) {
      return Response.json({ error: "Metode pembayaran harus diisi" }, { status: 400 });
    }

    // 1. Dapatkan data kunjungan
    const visitsRecords = await db.select().from(patientVisits).where(eq(patientVisits.id, visitId)).limit(1);
    if (visitsRecords.length === 0) {
      return Response.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    }
    const visit = visitsRecords[0];

    // Enforce branch access check
    const isAllowed = await checkBranchAccess(visit.branchId);
    if (!isAllowed) {
      return Response.json({ error: "Forbidden: Anda tidak memiliki akses ke cabang ini" }, { status: 403 });
    }

    if (visit.paymentStatus === "PAID") {
      return Response.json({ error: "Kunjungan sudah lunas" }, { status: 400 });
    }

    // 2. Dapatkan data pasien untuk deskripsi transaksi
    const patientRecords = await db.select().from(patients).where(eq(patients.id, visit.patientId)).limit(1);
    const patientName = patientRecords.length > 0 ? patientRecords[0].name : "Unknown";

    // 3. ISS-004: Dapatkan harga & nama layanan dari database (bukan hardcoded)
    const serviceRecord = await db
      .select({ price: services.price, name: services.name })
      .from(services)
      .where(eq(services.id, visit.serviceId))
      .limit(1);
    const basePrice = serviceRecord.length > 0 ? serviceRecord[0].price : 0;
    const serviceName = serviceRecord.length > 0 ? serviceRecord[0].name : visit.serviceId;

    const currentIso = new Date().toISOString();
    // Gunakan tanggal kedatangan pasien (visitDate) untuk catatan keuangan
    const trxDate = `${visit.visitDate}T${currentIso.split("T")[1]}`;

    if (basePrice > 0) {
      // A. Catat Pemasukan (Income)
      const newTrxId = crypto.randomUUID();

      await db.insert(financeTransactions).values({
        id: newTrxId,
        type: "INCOME",
        category: "Pendapatan Layanan",
        amount: basePrice,
        description: `Pembayaran Terapi (${serviceName}) atas nama ${patientName}`,
        referenceId: visitId,
        branchId: visit.branchId,
        paymentMethod: paymentMethod,
        date: trxDate
      });

      // Otomatisasi Jurnal (Debet: Kas, Kredit: Pendapatan Layanan)
      await createJournalEntry({
        date: trxDate,
        description: `[Auto] Pendapatan Layanan: ${serviceName} - ${patientName}`,
        referenceId: newTrxId,
        debitAccountId: COA.KAS,
        creditAccountId: COA.PENDAPATAN_LAYANAN,
        amount: basePrice
      });

      // B. Catat Komisi Terapis (langsung PAID - bagi hasil otomatis)
      if (visit.therapistId) {
        const therapistRecords = await db.select().from(therapists).where(eq(therapists.id, visit.therapistId)).limit(1);
        if (therapistRecords.length > 0) {
          const therapist = therapistRecords[0];
          
          // Check for service commission override first
          const customOverride = await db
            .select()
            .from(therapistServiceCommissions)
            .where(
              and(
                eq(therapistServiceCommissions.therapistId, visit.therapistId),
                eq(therapistServiceCommissions.serviceId, visit.serviceId)
              )
            )
            .limit(1);

          let commissionAmount = therapist.commissionRate || 0;
          if (customOverride.length > 0 && customOverride[0].commissionAmount !== null) {
            commissionAmount = customOverride[0].commissionAmount;
          }

          if (commissionAmount > 0) {
            // C. Sinkronisasi ke Laporan Bulanan Terapis — ambil data SEBELUM INSERT
            // agar query DB tidak menyertakan komisi yang baru saja di-INSERT (cegah double-count)
            const visitMonth = visit.visitDate.substring(0, 7); // YYYY-MM
            let savedReport: (typeof therapistMonthlyReports.$inferSelect)[] = [];
            let prevTotalCommissions = 0;
            try {
              savedReport = await db
                .select()
                .from(therapistMonthlyReports)
                .where(
                  and(
                    eq(therapistMonthlyReports.therapistId, visit.therapistId!),
                    eq(therapistMonthlyReports.month, visitMonth)
                  )
                )
                .limit(1);

              if (savedReport.length > 0) {
                // Query existing commissions BEFORE inserting the new one
                const existingCommissions = await db
                  .select({ amount: therapistCommissions.amount })
                  .from(therapistCommissions)
                  .innerJoin(patientVisits, eq(therapistCommissions.visitId, patientVisits.id))
                  .where(
                    and(
                      eq(therapistCommissions.therapistId, visit.therapistId!),
                      like(patientVisits.visitDate, `${visitMonth}%`)
                    )
                  );
                prevTotalCommissions = existingCommissions.reduce((s, c) => s + c.amount, 0);
              }
            } catch (syncErr) {
              console.error("Pre-fetch therapist monthly report error (non-fatal):", syncErr);
            }

            // Komisi langsung berstatus PAID (sudah disisihkan otomatis)
            await db.insert(therapistCommissions).values({
              id: crypto.randomUUID(),
              therapistId: visit.therapistId,
              visitId: visitId,
              amount: commissionAmount,
              status: "PAID",
              paidAt: trxDate,
            });

            // Langsung catat bagi hasil sebagai pengeluaran klinik
            const commTrxId = crypto.randomUUID();
            await db.insert(financeTransactions).values({
              id: commTrxId,
              type: "EXPENSE",
              category: "Bagi Hasil Terapis",
              amount: commissionAmount,
              description: `Bagi Hasil Terapis (${therapist.name}) - ${serviceName} - ${patientName}`,
              referenceId: visitId,
              branchId: visit.branchId,
              paymentMethod: paymentMethod,
              date: trxDate
            });

            // Otomatisasi Jurnal (Debet: Beban Komisi, Kredit: Kas)
            await createJournalEntry({
              date: trxDate,
              description: `[Auto] Bagi Hasil Terapis: ${therapist.name} - ${serviceName}`,
              referenceId: commTrxId,
              debitAccountId: COA.BEBAN_KOMISI,
              creditAccountId: COA.KAS,
              amount: commissionAmount
            });

            // Update laporan bulanan dengan total yang dihitung sebelum INSERT + commissionAmount
            if (savedReport.length > 0) {
              try {
                const report = savedReport[0];
                // ISS-003: prevTotalCommissions diambil sebelum INSERT, tambahkan commissionAmount
                // secara eksplisit — tidak ada double-count
                const newTotalCommissions = prevTotalCommissions + commissionAmount;
                const newTakeHomePay = report.baseSalary + newTotalCommissions + report.allowances + report.bonuses - report.deductions;

                await db
                  .update(therapistMonthlyReports)
                  .set({
                    commissions: newTotalCommissions,
                    takeHomePay: newTakeHomePay,
                    updatedAt: trxDate,
                  })
                  .where(eq(therapistMonthlyReports.id, report.id));
              } catch (syncErr) {
                console.error("Sync therapist monthly report error (non-fatal):", syncErr);
              }
            }
          }
        }
      }
    }

    // 4. Update status kunjungan menjadi PAID
    const payDate = new Date().toISOString();
    await db.update(patientVisits)
      .set({ paymentStatus: "PAID", updatedAt: payDate })
      .where(eq(patientVisits.id, visitId));

    // 5. Auto-generate invoice/struk
    let invoiceId = null;
    try {
      const branchRecords = await db.select().from(branches).where(eq(branches.id, visit.branchId)).limit(1);
      const branch = branchRecords[0];
      if (branch && basePrice > 0) {
        const dateStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(/-/g, "");
        const branchCode = branch.name.substring(0, 3).toUpperCase();
        const prefix = `INV-${branchCode}-${dateStr}`;
        const existingInvoices = await db.select().from(invoices).where(like(invoices.invoiceNumber, `${prefix}%`)).orderBy(desc(invoices.invoiceNumber));
        let seq = 1;
        if (existingInvoices.length > 0) {
          const lastSeq = parseInt(existingInvoices[0].invoiceNumber.split("-").pop() || "0");
          seq = lastSeq + 1;
        }
        const invoiceNumber = `${prefix}-${seq.toString().padStart(3, "0")}`;

        invoiceId = crypto.randomUUID();
        const therapistRecords2 = visit.therapistId ? await db.select().from(therapists).where(eq(therapists.id, visit.therapistId)).limit(1) : [];

        await db.insert(invoices).values({
          id: invoiceId,
          invoiceNumber,
          visitId,
          patientId: visit.patientId,
          patientName,
          patientPhone: patientRecords[0]?.phone || "",
          therapistId: visit.therapistId || null,
          therapistName: therapistRecords2.length > 0 ? therapistRecords2[0].name : null,
          branchId: visit.branchId,
          branchName: branch.name,
          branchAddress: branch.address,
          branchPhone: branch.phone,
          items: JSON.stringify([{ serviceId: visit.serviceId, name: serviceName, qty: 1, price: basePrice, subtotal: basePrice }]),
          subtotal: basePrice,
          discount: 0,
          tax: 0,
          grandTotal: basePrice,
          paymentMethod,
          amountPaid: basePrice,
          changeAmount: 0,
          createdAt: trxDate,
        });
      }
    } catch (invoiceErr) {
      console.error("Auto-generate invoice error (non-fatal):", invoiceErr);
    }

    return Response.json({ success: true, message: "Pembayaran berhasil diproses", invoiceId });
  } catch (error) {
    console.error("POST /api/patient-visits/[id]/pay error:", error);
    return Response.json({ error: "Gagal memproses pembayaran" }, { status: 500 });
  }
}
