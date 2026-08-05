import { db } from "../lib/db";
import { services, therapistServiceCommissions } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting to fix old services and 0 overrides...");

  console.log("Deleting 0 overrides in therapistServiceCommissions...");
  const delRes = await db.delete(therapistServiceCommissions).where(eq(therapistServiceCommissions.commissionAmount, 0));
  console.log(`Deleted 0 overrides`);

  console.log("Fetching all services...");
  const allServices = await db.select().from(services);
  
  const nameToGlobal: Record<string, number> = {};
  
  for (const s of allServices) {
    if (s.isActive && s.globalCommission !== null && s.globalCommission > 0) {
      nameToGlobal[s.name] = s.globalCommission;
    }
  }

  let updatedCount = 0;
  for (const s of allServices) {
    if ((s.globalCommission === 0 || s.globalCommission === null) && nameToGlobal[s.name]) {
      console.log(`Updating service ${s.name} (ID: ${s.id}) from ${s.globalCommission} to ${nameToGlobal[s.name]}`);
      await db.update(services)
        .set({ globalCommission: nameToGlobal[s.name] })
        .where(eq(services.id, s.id));
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} services.`);
  console.log("Done.");
}

main().catch(console.error).finally(() => process.exit(0));
