import { db } from "../lib/db";
import { services } from "../lib/db/schema";
import { eq, like, ilike, or } from "drizzle-orm";
import * as dotenv from "dotenv";

import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("Starting brand migration for services...");

  // Set all services with 'bekam' in the name to 'RADJA_BEKAM'
  const result = await db.update(services)
    .set({ brand: "RADJA_BEKAM" })
    .where(
      or(
        ilike(services.name, "%bekam%"),
        eq(services.category, "Bekam")
      )
    )
    .returning();

  console.log(`Updated ${result.length} services to RADJA_BEKAM brand.`);
  
  result.forEach(s => {
    console.log(`- ${s.name} [${s.category}]`);
  });

  console.log("Migration complete.");
  process.exit(0);
}

main().catch(console.error);
