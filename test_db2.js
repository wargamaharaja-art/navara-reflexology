const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
pool.query("SELECT id, invoice_number, branch_id, created_at FROM invoices ORDER BY created_at DESC LIMIT 5").then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
