import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { 
  patientVisits, 
  therapists, 
  therapistCommissions, 
  therapistServiceCommissions, 
  financeTransactions, 
  therapistMonthlyReports,
  services,
  patients
} from "./src/lib/db/schema";
import { eq, and, like } from "drizzle-orm";
import { createJournalEntry, COA } from "./src/lib/accounting";
import crypto from "crypto";

async function syncCommissions() {
  console.log("Memulai proses sinkronisasi (backfill) komisi terapis...");

  try {
    // 1. Get all PAID visits where therapist is assigned
    const visits = await db
      .select({
        id: patientVisits.id,
        visitDate: patientVisits.visitDate,
        updatedAt: patientVisits.updatedAt,
        therapistId: patientVisits.therapistId,
        serviceId: patientVisits.serviceId,
        branchId: patientVisits.branchId,
        patientId: patientVisits.patientId,
      })
      .from(patientVisits)
      .where(eq(patientVisits.paymentStatus, "PAID"));

    const visitsWithTherapist = visits.filter(v => v.therapistId !== null);
    console.log(`Ditemukan ${visitsWithTherapist.length} kunjungan berstatus PAID dengan terapis.`);

    let syncCount = 0;

    for (const visit of visitsWithTherapist) {
      if (!visit.therapistId) continue;

      // 2. Check if commission already exists
      const existingCommissions = await db
        .select()
        .from(therapistCommissions)
        .where(
          and(
            eq(therapistCommissions.visitId, visit.id),
            eq(therapistCommissions.therapistId, visit.therapistId)
          )
        );

      if (existingCommissions.length === 0) {
        // Commission missing. Calculate it.
        const therapistRecords = await db.select().from(therapists).where(eq(therapists.id, visit.therapistId)).limit(1);
        if (therapistRecords.length === 0) continue;
        const therapist = therapistRecords[0];

        // Check override
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
          console.log(`Memproses kunjungan ${visit.id} (Terapis: ${therapist.name}) - Komisi: Rp${commissionAmount}`);

          const serviceRecord = await db.select({ name: services.name }).from(services).where(eq(services.id, visit.serviceId)).limit(1);
          const serviceName = serviceRecord.length > 0 ? serviceRecord[0].name : "Unknown Service";

          const patientRecord = await db.select({ name: patients.name }).from(patients).where(eq(patients.id, visit.patientId)).limit(1);
          const patientName = patientRecord.length > 0 ? patientRecord[0].name : "Unknown Patient";

          const currentIso = new Date().toISOString();
          const trxDate = `${visit.visitDate}T${currentIso.split("T")[1]}`; // Use visit date for financial record

          // Insert Commission
          await db.insert(therapistCommissions).values({
            id: crypto.randomUUID(),
            therapistId: visit.therapistId,
            visitId: visit.id,
            amount: commissionAmount,
            status: "PAID",
            paidAt: trxDate,
          });

          // Insert Finance Transaction (Expense)
          const commTrxId = crypto.randomUUID();
          await db.insert(financeTransactions).values({
            id: commTrxId,
            type: "EXPENSE",
            category: "Bagi Hasil Terapis",
            amount: commissionAmount,
            description: `[Auto Sync] Bagi Hasil Terapis (${therapist.name}) - ${serviceName} - ${patientName}`,
            referenceId: visit.id,
            branchId: visit.branchId,
            paymentMethod: "CASH",
            date: trxDate
          });

          // Create Journal Entry
          await createJournalEntry({
            date: trxDate,
            description: `[Auto Sync] Bagi Hasil Terapis: ${therapist.name} - ${serviceName}`,
            referenceId: commTrxId,
            debitAccountId: COA.BEBAN_KOMISI,
            creditAccountId: COA.KAS,
            amount: commissionAmount
          });

          // Update Monthly Report
          const visitMonth = visit.visitDate.substring(0, 7); // YYYY-MM
          let savedReport = await db
            .select()
            .from(therapistMonthlyReports)
            .where(
              and(
                eq(therapistMonthlyReports.therapistId, visit.therapistId),
                eq(therapistMonthlyReports.month, visitMonth)
              )
            )
            .limit(1);

          if (savedReport.length > 0) {
            const report = savedReport[0];
            const newTotalCommissions = report.commissions + commissionAmount;
            const newTakeHomePay = report.baseSalary + newTotalCommissions + report.allowances + report.bonuses - report.deductions;

            await db
              .update(therapistMonthlyReports)
              .set({
                commissions: newTotalCommissions,
                takeHomePay: newTakeHomePay,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(therapistMonthlyReports.id, report.id));
          }

          syncCount++;
        }
      }
    }

    console.log(`✅ Proses selesai! Berhasil menyinkronkan ${syncCount} data komisi terapis.`);
  } catch (error) {
    console.error("❌ Gagal melakukan sinkronisasi:", error);
  } finally {
    process.exit(0);
  }
}

syncCommissions();
