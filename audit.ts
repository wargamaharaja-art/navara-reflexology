import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db/index";
import { financeTransactions, patientVisits, invoices } from "./src/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

async function main() {
  console.log("=== AUDIT KEUANGAN ===");
  
  // 1. Total Income dari financeTransactions
  const financeResult = await db.execute(sql`SELECT SUM(amount) as total FROM finance_transactions WHERE type = 'INCOME'`);
  console.log("Total Income (finance_transactions):", financeResult.rows[0].total);

  // 2. Rincian per kategori di financeTransactions
  const financeGrouped = await db.execute(sql`SELECT category, SUM(amount) as total, COUNT(*) as count FROM finance_transactions WHERE type = 'INCOME' GROUP BY category`);
  console.log("\nIncome per Kategori (finance_transactions):");
  console.table(financeGrouped.rows);

  // 3. Total Omzet dari Invoices (bisa jadi acuan spreadsheet)
  const invoiceResult = await db.execute(sql`SELECT SUM(grand_total) as total FROM invoices`);
  console.log("\nTotal Omzet (invoices):", invoiceResult.rows[0].total);
  
  // 4. Total dari kunjungan pasien (paid)
  const visitsResult = await db.execute(sql`
    SELECT SUM(s.price) as total 
    FROM patient_visits v 
    JOIN services s ON v.service_id = s.id 
    WHERE v.payment_status = 'PAID'
  `);
  console.log("\nTotal dari kunjungan pasien PAID (patient_visits + services):", visitsResult.rows[0].total);

  // 5. Cek jika ada transaksi manual di finance (reference_id is null)
  const manualFinance = await db.execute(sql`SELECT * FROM finance_transactions WHERE type = 'INCOME' AND reference_id IS NULL`);
  console.log(`\nTransaksi Manual (tanpa referensi kunjungan): ${manualFinance.rows.length}`);
  if (manualFinance.rows.length > 0) {
    console.table(manualFinance.rows.map(r => ({ date: r.date, amount: r.amount, desc: r.description })));
  }

  process.exit(0);
}

main().catch(console.error);
