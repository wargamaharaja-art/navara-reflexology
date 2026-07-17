const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const visits = await pool.query(`SELECT pv.id as visit_id, pv.service_id, p.name FROM patient_visits pv JOIN patients p ON pv.patient_id = p.id WHERE p.name ILIKE '%ela%'`);
    console.log('Original visits:', visits.rows);

    const invoices = await pool.query(`SELECT id, items FROM invoices WHERE patient_name ILIKE '%ela%'`);
    console.log('Invoices:', invoices.rows);

    if (visits.rows.length > 0 && invoices.rows.length > 0) {
      const invoiceItems = JSON.parse(invoices.rows[0].items);
      const correctServiceId = invoiceItems[0].serviceId || invoiceItems[0].name;
      
      console.log(`Fixing visit ${visits.rows[0].visit_id} to service ${correctServiceId}`);
      await pool.query(`UPDATE patient_visits SET service_id = $1 WHERE id = $2`, [correctServiceId, visits.rows[0].visit_id]);
      console.log('Fixed successfully.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
