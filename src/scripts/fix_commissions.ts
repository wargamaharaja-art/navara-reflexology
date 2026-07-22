import { db } from "../lib/db";
import { patientVisits, therapistCommissions, financeTransactions, services, therapists, therapistServiceCommissions } from "../lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { calculateCommissionAmount } from "../lib/commission";

async function runFix() {
  console.log("Memulai Sinkronisasi/Fix Komisi Terapis...");
  
  // 1. Ambil semua kunjungan selesai
  const completedVisits = await db.select().from(patientVisits)
    .where(
      and(
        eq(patientVisits.status, "completed"),
        sql`${patientVisits.therapistId} IS NOT NULL`
      )
    );
  
  if (completedVisits.length === 0) return;

  const visitIds = completedVisits.map(v => v.id);

  // 2. Fetch all related data in bulk
  const allCommissions = await db.select().from(therapistCommissions)
    .where(inArray(therapistCommissions.visitId, visitIds));
    
  const allFinanceTxs = await db.select().from(financeTransactions)
    .where(
      and(
        inArray(financeTransactions.referenceId, visitIds),
        eq(financeTransactions.type, "EXPENSE"),
        sql`${financeTransactions.description} LIKE '%Bagi Hasil Terapis%'`
      )
    );

  const allServices = await db.select().from(services);
  const allTherapists = await db.select().from(therapists);
  const allOverrides = await db.select().from(therapistServiceCommissions);

  // Indexes for fast lookup
  const commMap = new Map<string, typeof allCommissions>();
  allCommissions.forEach(c => {
    if (!commMap.has(c.visitId)) commMap.set(c.visitId, []);
    commMap.get(c.visitId)!.push(c);
  });

  const txMap = new Map<string, typeof allFinanceTxs>();
  allFinanceTxs.forEach(t => {
    if (!t.referenceId) return;
    if (!txMap.has(t.referenceId)) txMap.set(t.referenceId, []);
    txMap.get(t.referenceId)!.push(t);
  });

  const svcMap = new Map(allServices.map(s => [s.id, s]));
  const thMap = new Map(allTherapists.map(t => [t.id, t]));
  const overMap = new Map(allOverrides.map(o => [`${o.therapistId}-${o.serviceId}`, o]));

  let fixedMissing = 0;
  let fixedIncorrect = 0;

  for (const visit of completedVisits) {
    const therapistId = visit.therapistId!;
    const serviceId = visit.serviceId;
    
    const commissions = commMap.get(visit.id) || [];
    const financeTxs = txMap.get(visit.id) || [];

    const overrideCommission = overMap.get(`${therapistId}-${serviceId}`)?.commissionAmount || null;
    const serviceGlobalCommission = svcMap.get(serviceId)?.globalCommission || 0;
    const therapistCommissionRate = thMap.get(therapistId)?.commissionRate || 0;
    
    const expectedCommission = calculateCommissionAmount({
      overrideCommission,
      serviceGlobalCommission,
      therapistCommissionRate,
      qty: 1
    });

    if (expectedCommission <= 0) continue;

    // Rule 1: Missing Commission
    if (commissions.length === 0) {
      console.log(`Fixing Missing Commission for Visit: ${visit.id} -> Expected: ${expectedCommission}`);
      
      const commId = `C-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await db.insert(therapistCommissions).values({
        id: commId,
        therapistId,
        visitId: visit.id,
        amount: expectedCommission,
        status: "PAID",
        paidAt: new Date().toISOString()
      });

      if (financeTxs.length === 0) {
        const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await db.insert(financeTransactions).values({
          id: txId,
          type: "EXPENSE",
          category: "Bagi Hasil Terapis",
          amount: expectedCommission,
          description: `Bagi Hasil Terapis - Visit ${visit.id}`,
          referenceId: visit.id,
          branchId: visit.branchId,
          paymentMethod: "CASH" // Assume cash for now if generated retroactively
        });
      }

      fixedMissing++;
      continue;
    }

    // Rule 2: Incorrect Commission
    if (commissions.length > 0) {
      // Just take the first one (we know double is 0 from audit)
      const comm = commissions[0];
      if (comm.amount !== expectedCommission) {
        console.log(`Fixing Incorrect Commission for Visit: ${visit.id} -> Was: ${comm.amount}, Now: ${expectedCommission}`);
        
        await db.update(therapistCommissions)
          .set({ amount: expectedCommission })
          .where(eq(therapistCommissions.id, comm.id));

        for (const tx of financeTxs) {
          await db.update(financeTransactions)
            .set({ amount: expectedCommission })
            .where(eq(financeTransactions.id, tx.id));
        }

        fixedIncorrect++;
      }
    }
  }

  console.log("\n=== HASIL SINKRONISASI ===");
  console.log(`Total Data Missing Diperbaiki: ${fixedMissing}`);
  console.log(`Total Data Incorrect Diperbaiki: ${fixedIncorrect}`);
}

runFix().then(() => {
  console.log("Fix selesai.");
  process.exit(0);
}).catch(err => {
  console.error("Fix error:", err);
  process.exit(1);
});
