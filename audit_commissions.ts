import { db } from "./src/lib/db/index";
import { therapists, services, therapistServiceCommissions, therapistCommissions, patientVisits } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Fetching therapists...");
  const allTherapists = await db.select().from(therapists);
  const suci = allTherapists.find(t => t.name.toLowerCase().includes("suci"));
  console.log("Suci:", suci);

  console.log("Fetching services...");
  const allServices = await db.select().from(services);
  
  console.log("Fetching global commissions (from other therapists)...");
  const tComms = await db.select().from(therapistServiceCommissions);
  const globalComms: Record<string, number> = {};
  for (const c of tComms) {
    if (c.therapistId !== suci?.id) {
      if (c.commissionAmount !== null) {
        globalComms[c.serviceId] = c.commissionAmount;
      }
    }
  }
  
  console.log("Global commissions:");
  for (const svcId of Object.keys(globalComms)) {
    const svc = allServices.find(s => s.id === svcId);
    console.log(`- ${svc?.name}: ${globalComms[svcId]}`);
  }
  
  if (suci) {
    console.log("Suci's commissions in DB (therapist_commissions):");
    const suciComms = await db.select().from(therapistCommissions).where(eq(therapistCommissions.therapistId, suci.id));
    for (const c of suciComms) {
      const visit = await db.select().from(patientVisits).where(eq(patientVisits.id, c.visitId)).limit(1);
      if (visit.length > 0) {
        const svc = allServices.find(s => s.id === visit[0].serviceId);
        console.log(`- Visit ${c.visitId} | ${svc?.name}: Rp ${c.amount} (Expected: Rp ${globalComms[visit[0].serviceId]})`);
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);
