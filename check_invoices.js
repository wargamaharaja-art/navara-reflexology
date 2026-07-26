const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`SELECT id, "invoice_number", "created_at" FROM invoices WHERE "created_at" LIKE '2026-07-24%'`);
    console.log('Invoices on 2026-07-24:', res.rows.length);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
