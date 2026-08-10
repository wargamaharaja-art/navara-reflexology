import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("./src/lib/db");
  const { therapistCommissions, patientVisits, invoices, therapistMonthlyReports } = await import("./src/lib/db/schema");
  const { calculateTherapistCommission } = await import("./src/lib/commission");
  const { eq, and, isNotNull, isNull } = await import("drizzle-orm");
  const crypto = await import("crypto");

  console.log("Checking all existing commissions...");
  const commissions = await db
      .select({
        id: therapistCommissions.id,
        therapistId: therapistCommissions.therapistId,
        visitId: therapistCommissions.visitId,
        amount: therapistCommissions.amount,
        serviceId: patientVisits.serviceId,
        visitDate: patientVisits.visitDate,
        branchId: patientVisits.branchId,
        invoiceItems: invoices.items,
      })
      .from(therapistCommissions)
      .innerJoin(
        patientVisits,
        eq(therapistCommissions.visitId, patientVisits.id),
      )
      .leftJoin(
        invoices,
        eq(patientVisits.id, invoices.visitId)
      );

  let updatedCount = 0;
  for (const c of commissions) {
      let correctAmount = 0;
      if (c.invoiceItems) {
        try {
          const items = JSON.parse(c.invoiceItems);
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.serviceId) {
                const itemComm = await calculateTherapistCommission(
                  db,
                  c.therapistId,
                  item.serviceId,
                  item.qty || 1,
                  c.branchId
                );
                correctAmount += itemComm;
              }
            }
          }
        } catch (e) {}
      }
      
      if (correctAmount === 0 && c.serviceId) {
        correctAmount = await calculateTherapistCommission(db, c.therapistId, c.serviceId, 1, c.branchId);
      }

      if (c.amount !== correctAmount) {
         await db.update(therapistCommissions).set({ amount: correctAmount }).where(eq(therapistCommissions.id, c.id));
         console.log(`Updated commission ${c.id}: ${c.amount} -> ${correctAmount}`);
         updatedCount++;
      }
  }

  console.log(`Finished checking existing commissions. Updated ${updatedCount} records.`);

  console.log("Checking missing visits without commissions...");
  const missingVisits = await db
      .select({
        visitId: patientVisits.id,
        therapistId: patientVisits.therapistId,
        serviceId: patientVisits.serviceId,
        visitDate: patientVisits.visitDate,
        paymentStatus: patientVisits.paymentStatus,
        branchId: patientVisits.branchId,
        invoiceItems: invoices.items,
      })
      .from(patientVisits)
      .leftJoin(
        therapistCommissions,
        eq(patientVisits.id, therapistCommissions.visitId),
      )
      .leftJoin(
        invoices,
        eq(patientVisits.id, invoices.visitId)
      )
      .where(
        and(
          eq(patientVisits.status, "completed"),
          isNotNull(patientVisits.therapistId),
          isNull(therapistCommissions.id),
        ),
      );

  let insertedCount = 0;
  for (const v of missingVisits) {
      if (!v.therapistId || !v.serviceId) continue;
      let commissionAmount = 0;
      if (v.invoiceItems) {
        try {
          const items = JSON.parse(v.invoiceItems);
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.serviceId) {
                const itemComm = await calculateTherapistCommission(
                  db,
                  v.therapistId,
                  item.serviceId,
                  item.qty || 1,
                  v.branchId
                );
                commissionAmount += itemComm;
              }
            }
          }
        } catch (e) {}
      }
      
      if (commissionAmount === 0 && v.serviceId) {
        commissionAmount = await calculateTherapistCommission(db, v.therapistId, v.serviceId, 1, v.branchId);
      }

      if (commissionAmount > 0) {
         await db.insert(therapistCommissions).values({
              id: crypto.randomUUID(),
              therapistId: v.therapistId,
              visitId: v.visitId,
              amount: commissionAmount,
              status: v.paymentStatus === "PAID" ? "PAID" : "PENDING",
              paidAt: v.paymentStatus === "PAID" ? new Date().toISOString() : null,
         });
         console.log(`Inserted missing commission for visit ${v.visitId}: ${commissionAmount}`);
         insertedCount++;
      }
  }
  
  console.log(`Finished checking missing visits. Inserted ${insertedCount} records.`);

  // Invalidate monthly reports
  await db.delete(therapistMonthlyReports);
  console.log("Invalidated monthly reports caching so they can be regenerated.");

  process.exit(0);
}
main();
