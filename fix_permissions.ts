import { db } from "./src/lib/db";
import { admins } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDefaultPermissions } from "./src/lib/auth";

async function main() {
  console.log("Fetching all cashiers...");
  const dbAdmins = await db.select().from(admins).where(eq(admins.role, "CASHIER"));
  
  const defaultCashierPerms = getDefaultPermissions("CASHIER");

  for (const admin of dbAdmins) {
    let currentPerms = [];
    if (admin.permissions) {
      try {
        currentPerms = JSON.parse(admin.permissions);
      } catch(e) {}
    } else {
      currentPerms = defaultCashierPerms;
    }

    // Merge new permissions if not present
    const newPerms = new Set(currentPerms);
    for (const p of defaultCashierPerms) {
      newPerms.add(p);
    }
    
    // Convert back to array
    const finalPerms = Array.from(newPerms);
    
    console.log(`Updating ${admin.username} (${admin.name}) with merged permissions.`);
    await db.update(admins).set({ permissions: JSON.stringify(finalPerms) }).where(eq(admins.id, admin.id));
  }
  
  console.log("Done updating cashier permissions!");
  process.exit(0);
}

main().catch(console.error);
