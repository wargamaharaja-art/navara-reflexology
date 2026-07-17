const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  await pool.query(`UPDATE patient_visits SET service_id = (SELECT id FROM services WHERE name = 'Full Body Massages + Bekam Sunnah + Totok Wajah' LIMIT 1) WHERE id = 'V-1783936415221-1059'`);
  console.log('Fixed Ibu ela');
  pool.end();
}
run();
