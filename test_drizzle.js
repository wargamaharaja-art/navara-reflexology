const { eq, and, like, desc } = require("drizzle-orm");
const { db } = require("./src/lib/db");
const { invoices } = require("./src/lib/db/schema");

async function main() {
  const result = await db.select().from(invoices).where(like(invoices.createdAt, '2026-07-24%'));
  console.log(result.length, "invoices found for 2026-07-24");
  
  const allInvoices = await db.select().from(invoices).limit(5);
  console.log("Sample createdAt:", allInvoices.map(i => i.createdAt));
}
main().catch(console.error);
