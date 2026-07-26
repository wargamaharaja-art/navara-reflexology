const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    // 1. Total Income dari finance_transactions
    const finance = await client.execute("SELECT SUM(amount) as total FROM finance_transactions WHERE type = 'INCOME'");
    console.log("Total Pemasukan (Dashboard):", finance.rows[0].total);

    // 2. Total Omzet dari invoices
    const invoice = await client.execute("SELECT SUM(grand_total) as total FROM invoices");
    console.log("Total Omzet (Invoices):", invoice.rows[0].total);

    // 3. Discrepancies: invoices updated but finance_transactions not updated
    // Note: SQLite columns might be camelCase or snake_case depending on how Drizzle generated them
    // Let's get the schema for finance_transactions and invoices
    const fSchema = await client.execute("PRAGMA table_info(finance_transactions)");
    const iSchema = await client.execute("PRAGMA table_info(invoices)");
    
    // Check if column is amount or grand_total
    const amountCol = fSchema.rows.find(r => r.name === 'amount') ? 'amount' : 'amount';
    const grandTotalCol = iSchema.rows.find(r => r.name === 'grandTotal') ? 'grandTotal' : 'grand_total';
    const refCol = fSchema.rows.find(r => r.name === 'referenceId') ? 'referenceId' : 'reference_id';
    const visitCol = iSchema.rows.find(r => r.name === 'visitId') ? 'visitId' : 'visit_id';

    console.log(`Checking discrepancy using f.${amountCol} and i.${grandTotalCol}`);

    const discrepancies = await client.execute(`
      SELECT f.${amountCol} as finance_amount, i.${grandTotalCol} as invoice_amount, i.discount, i.id as invoice_id, f.${refCol} as visit_id
      FROM finance_transactions f
      JOIN invoices i ON i.${visitCol} = f.${refCol}
      WHERE f.type = 'INCOME' AND f.${amountCol} != i.${grandTotalCol}
    `);

    console.log("\nDiscrepancies found:", discrepancies.rows.length);
    if (discrepancies.rows.length > 0) {
      console.table(discrepancies.rows);
    }
    
    // 4. Manual income
    const manual = await client.execute(`
      SELECT * FROM finance_transactions WHERE type = 'INCOME' AND ${refCol} IS NULL
    `);
    console.log("\nManual Income found:", manual.rows.length);
    if (manual.rows.length > 0) {
       console.table(manual.rows.map(r => ({ desc: r.description, amount: r.amount })));
    }

  } catch(e) {
    console.error(e);
  }
}
run();
