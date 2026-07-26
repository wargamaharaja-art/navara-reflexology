const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const dateParam = '2026-07-24';
    const res = await pool.query(`SELECT id, "invoice_number", "created_at", "branch_id" FROM invoices WHERE "created_at" LIKE $1`, [`${dateParam}%`]);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
