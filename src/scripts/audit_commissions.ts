import { db } from "../lib/db";
import { patientVisits, therapistCommissions, financeTransactions, services, therapists, therapistServiceCommissions } from "../lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { calculateCommissionAmount } from "../lib/commission";

async function runAudit() {
  console.log("Memulai Audit Komisi Terapis...");
  
  // 1. Ambil semua kunjungan selesai
  const completedVisits = await db.select().from(patientVisits)
    .where(
      and(
        eq(patientVisits.status, "completed"),
        sql`${patientVisits.therapistId} IS NOT NULL`
      )
    );
  console.log(`Ditemukan ${completedVisits.length} kunjungan selesai dengan terapis.`);
  
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

  const anomalies = {
    doubleCommissions: [] as any[],
    missingCommissions: [] as any[],
    incorrectCommissions: [] as any[]
  };

  for (const visit of completedVisits) {
    const therapistId = visit.therapistId!;
    const serviceId = visit.serviceId;
    
    const commissions = commMap.get(visit.id) || [];
    const financeTxs = txMap.get(visit.id) || [];

    // Calculate expected commission
    const overrideCommission = overMap.get(`${therapistId}-${serviceId}`)?.commissionAmount || null;
    const serviceGlobalCommission = svcMap.get(serviceId)?.globalCommission || 0;
    const therapistCommissionRate = thMap.get(therapistId)?.commissionRate || 0;
    
    const expectedCommission = calculateCommissionAmount({
      overrideCommission,
      serviceGlobalCommission,
      therapistCommissionRate,
      qty: 1
    });

    // Rule 1: Double Commission
    if (commissions.length > 1 || financeTxs.length > 1) {
      anomalies.doubleCommissions.push({
        visitId: visit.id,
        therapistId,
        commissionsCount: commissions.length,
        financeTxsCount: financeTxs.length,
        date: visit.visitDate
      });
    }

    // Rule 2: Missing Commission
    if (expectedCommission > 0 && commissions.length === 0) {
      anomalies.missingCommissions.push({
        visitId: visit.id,
        therapistId,
        expectedCommission,
        date: visit.visitDate
      });
    }

    // Rule 3: Incorrect Commission
    if (commissions.length > 0) {
      for (const comm of commissions) {
        if (comm.amount !== expectedCommission) {
          anomalies.incorrectCommissions.push({
            visitId: visit.id,
            therapistId,
            recordedAmount: comm.amount,
            expectedAmount: expectedCommission,
            date: visit.visitDate
          });
        }
      }
    }
  }

  console.log("\n=== HASIL AUDIT ===");
  console.log(`Total Kunjungan Diperiksa: ${completedVisits.length}`);
  console.log(`Komisi Double: ${anomalies.doubleCommissions.length}`);
  console.log(`Komisi Hilang/Tidak Masuk: ${anomalies.missingCommissions.length}`);
  console.log(`Komisi Tidak Sesuai: ${anomalies.incorrectCommissions.length}`);

  if (anomalies.doubleCommissions.length > 0) {
    console.log("\n[!] DAFTAR KOMISI DOUBLE:");
    console.table(anomalies.doubleCommissions.slice(0, 20));
    if (anomalies.doubleCommissions.length > 20) console.log(`... and ${anomalies.doubleCommissions.length - 20} more.`);
  }

  if (anomalies.missingCommissions.length > 0) {
    console.log("\n[!] DAFTAR KOMISI TIDAK MASUK:");
    console.table(anomalies.missingCommissions.slice(0, 20));
    if (anomalies.missingCommissions.length > 20) console.log(`... and ${anomalies.missingCommissions.length - 20} more.`);
  }

  if (anomalies.incorrectCommissions.length > 0) {
    console.log("\n[!] DAFTAR KOMISI TIDAK SESUAI:");
    console.table(anomalies.incorrectCommissions.slice(0, 20));
    if (anomalies.incorrectCommissions.length > 20) console.log(`... and ${anomalies.incorrectCommissions.length - 20} more.`);
  }
}

runAudit().then(() => {
  console.log("Audit selesai.");
  process.exit(0);
}).catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
