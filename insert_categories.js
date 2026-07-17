const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const categories = [
    { name: 'biaya penyusutan sewa ruko', type: 'EXPENSE' },
    { name: 'biaya sistem kasir', type: 'EXPENSE' }
  ];
  
  for (const cat of categories) {
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO finance_categories (id, name, type, is_active) VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`, [id, cat.name, cat.type]);
    console.log(`Inserted ${cat.name}`);
  }
  
  pool.end();
}
run();
