import { db } from "../lib/db";
import { patientVisits, therapistCommissions, financeTransactions, services, therapists, therapistServiceCommissions, invoices } from "../lib/db/schema";
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

  const visitIds = completedVisits.map((v: any) => v.id);

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

  const allServices: any[] = await db.select().from(services);
  const allTherapists: any[] = await db.select().from(therapists);
  const allOverrides: any[] = await db.select().from(therapistServiceCommissions);
  const allInvoices: any[] = await db.select().from(invoices)
    .where(inArray(invoices.visitId, visitIds));

  // Indexes for fast lookup
  const commMap = new Map<string, any[]>();
  allCommissions.forEach((c: any) => {
    if (!commMap.has(c.visitId)) commMap.set(c.visitId, []);
    commMap.get(c.visitId)!.push(c);
  });

  const txMap = new Map<string, any[]>();
  allFinanceTxs.forEach((t: any) => {
    if (!t.referenceId) return;
    if (!txMap.has(t.referenceId)) txMap.set(t.referenceId, []);
    txMap.get(t.referenceId)!.push(t);
  });

  const svcMap = new Map<string, any>(allServices.map((s: any) => [s.id, s]));
  const thMap = new Map<string, any>(allTherapists.map((t: any) => [t.id, t]));
  const overMap = new Map<string, any>(allOverrides.map((o: any) => [`${o.therapistId}-${o.serviceId}`, o]));
  const invoiceMap = new Map<string, any>(allInvoices.map((i: any) => [i.visitId, i]));

  let fixedMissing = 0;
  let fixedIncorrect = 0;

  for (const visit of completedVisits as any[]) {
    const therapistId = visit.therapistId!;
    
    const commissions = commMap.get(visit.id) || [];
    const financeTxs = txMap.get(visit.id) || [];

    // Gunakan items dari invoice jika ada, agar sinkron dengan yang dibayarkan
    let itemsToProcess: { serviceId: string | null, qty: number }[] = [];
    const invoice = invoiceMap.get(visit.id);
    if (invoice && invoice.items) {
      try {
        const parsedItems = JSON.parse(invoice.items as string);
        itemsToProcess = parsedItems.map((item: any) => ({
          serviceId: item.serviceId,
          qty: item.qty || 1
        }));
      } catch (e) {
        itemsToProcess = [{ serviceId: visit.serviceId, qty: 1 }];
      }
    } else {
      itemsToProcess = [{ serviceId: visit.serviceId, qty: 1 }];
    }

    let expectedTotalCommission = 0;
    
    for (const item of itemsToProcess) {
      const serviceId = item.serviceId;
      if (!serviceId) continue;
      
      const overrideCommission = overMap.get(`${therapistId}-${serviceId}`)?.commissionAmount || null;
      const serviceGlobalCommission = svcMap.get(serviceId)?.globalCommission || 0;
      const therapistCommissionRate = thMap.get(therapistId)?.commissionRate || 0;
      
      const expectedCommission = calculateCommissionAmount({
        overrideCommission,
        serviceGlobalCommission,
        therapistCommissionRate,
        serviceCategory: svcMap.get(serviceId)?.category,
        qty: item.qty || 1
      });
      
      expectedTotalCommission += expectedCommission;
    }

    // Rule 1: Missing Commission
    if (commissions.length === 0) {
      if (expectedTotalCommission <= 0) continue;

      console.log(`Fixing Missing Commission for Visit: ${visit.id} -> Expected: ${expectedTotalCommission}`);
      
      const commId = `C-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await db.insert(therapistCommissions).values({
        id: commId,
        therapistId,
        visitId: visit.id,
        amount: expectedTotalCommission,
        status: "PAID",
        paidAt: new Date().toISOString()
      });

      if (financeTxs.length === 0) {
        const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const therapistRec = await db.select({ name: therapists.name }).from(therapists).where(eq(therapists.id, therapistId)).limit(1);
        const tName = therapistRec[0]?.name || "Terapis";

        await db.insert(financeTransactions).values({
          id: txId,
          type: "EXPENSE",
          category: "Bagi Hasil Terapis",
          amount: expectedTotalCommission,
          description: `Bagi Hasil Terapis (${tName}) - Visit ${visit.id}`,
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
      if (comm.amount !== expectedTotalCommission) {
        console.log(`Fixing Incorrect Commission for Visit: ${visit.id} -> Was: ${comm.amount}, Now: ${expectedTotalCommission}`);
        
        await db.update(therapistCommissions)
          .set({ amount: expectedTotalCommission })
          .where(eq(therapistCommissions.id, comm.id));

        for (const tx of financeTxs) {
          await db.update(financeTransactions)
            .set({ amount: expectedTotalCommission })
            .where(eq(financeTransactions.id, tx.id));
        }

        fixedIncorrect++;
      } else {
        // debug
        // console.log(`Commission match for ${visit.id}: ${comm.amount}`);
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
