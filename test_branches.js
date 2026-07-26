const { eq, and, like, desc } = require("drizzle-orm");
const { db } = require("./src/lib/db");
const { invoices, branches } = require("./src/lib/db/schema");

async function main() {
  const result = await db.select({ id: invoices.id, branchId: invoices.branchId }).from(invoices).where(like(invoices.createdAt, '2026-07-24%'));
  console.log("Invoices branch ids:", result.map(r => r.branchId));
  
  const allBranches = await db.select().from(branches);
  console.log("Branches:", allBranches.map(b => ({id: b.id, name: b.name})));
}
main().catch(console.error);
