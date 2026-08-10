import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("./src/lib/db");
  const { services, serviceBranchPrices } = await import("./src/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const srv = await db.select().from(services).where(eq(services.id, "SRV-1782127916315"));
  console.log("Service:", JSON.stringify(srv, null, 2));

  const branchPrices = await db.select().from(serviceBranchPrices).where(eq(serviceBranchPrices.serviceId, "SRV-1782127916315"));
  console.log("Branch Prices:", JSON.stringify(branchPrices, null, 2));

  process.exit(0);
}
main();
