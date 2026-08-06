require("dotenv").config({ path: ".env.local" });
const { db } = require("../lib/db");
const { financeTransactions, branches } = require("../lib/db/schema");
const { eq, and } = require("drizzle-orm");

async function main() {
  const allBranches = await db.select().from(branches);
  const kelapaDua = allBranches.find(b => b.name.toLowerCase().includes("kelapa dua"));
  
  if (!kelapaDua) {
    console.log("Branch Navara Kelapa Dua not found.");
    process.exit(0);
  }
  
  const transactions = await db.select().from(financeTransactions).where(
    and(
      eq(financeTransactions.branchId, kelapaDua.id),
      eq(financeTransactions.category, "Bagi Hasil Terapis")
    )
  );
  
  const byMonth = {};
  
  transactions.forEach(t => {
    // get YYYY-MM
    const dateStr = t.date.substring(0, 7);
    if (!byMonth[dateStr]) {
      byMonth[dateStr] = { total: 0, byTherapist: {} };
    }
    
    byMonth[dateStr].total += t.amount;
    
    const match = t.description.match(/\(([^)]+)\)/);
    const therapistName = match ? match[1] : "Unknown";
    
    if (!byMonth[dateStr].byTherapist[therapistName]) {
      byMonth[dateStr].byTherapist[therapistName] = 0;
    }
    byMonth[dateStr].byTherapist[therapistName] += t.amount;
  });
  
  for (const [month, data] of Object.entries(byMonth)) {
    console.log(`\nMonth: ${month}`);
    console.log(`Total: Rp ${data.total}`);
    for (const [name, amount] of Object.entries(data.byTherapist)) {
      console.log(`  - ${name}: Rp ${amount}`);
    }
  }
  
  process.exit(0);
}

main().catch(console.error);
