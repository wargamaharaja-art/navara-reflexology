const Database = require('better-sqlite3');
const db = new Database('local.db', { readonly: true });

try {
  // Query total from financeTransactions
  const financeIncome = db.prepare(`SELECT SUM(amount) as total FROM finance_transactions WHERE type = 'INCOME'`).get();
  console.log("Total Pemasukan (Dashboard - finance_transactions):", financeIncome.total);

  // Query total from invoices
  const invoiceTotal = db.prepare(`SELECT SUM(grand_total) as total FROM invoices`).get();
  console.log("Total Omzet (Invoices):", invoiceTotal.total);

  // Compare discrepancies
  const discrepancies = db.prepare(`
    SELECT f.amount as finance_amount, i.grand_total as invoice_amount, i.discount, i.id as invoice_id, f.reference_id as visit_id
    FROM finance_transactions f
    JOIN invoices i ON i.visit_id = f.reference_id
    WHERE f.type = 'INCOME' AND f.amount != i.grand_total
  `).all();
  
  console.log("\nDiscrepancies found:", discrepancies.length);
  if (discrepancies.length > 0) {
    console.table(discrepancies);
  }

} catch (e) {
  console.error("Error reading local.db:", e);
}
db.close();
