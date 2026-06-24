const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  console.log('Connecting to local database...');
  const localDb = new Database('local.db');

  console.log('Connecting to Turso...');
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const tables = localDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
  console.log(`Found ${tables.length} tables to migrate.`);

  // Define topological order for insertion to avoid foreign key constraints
  const order = [
    'settings',
    'branches',
    'services',
    'users',
    'admins',
    'therapists',
    'patients',
    'reservations',
    'patient_visits',
    'invoices',
    'finance_transactions',
    'attendance',
    'therapist_commissions',
    'therapist_monthly_reports',
    'journal_entries',
    'journal_lines',
    'therapist_service_commissions'
  ];

  // Put remaining tables at the end
  for (const table of tables) {
    if (!order.includes(table)) {
      order.push(table);
    }
  }

  for (const table of order) {
    if (!tables.includes(table)) continue;
    
    const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) {
      console.log(`Skipping ${table} (0 rows)`);
      continue;
    }

    console.log(`Migrating ${table} (${rows.length} rows)...`);
    
    // For each row, construct an insert query
    // To be safe, we use transactions if LibSQL supports it, but simple inserts are fine.
    
    let count = 0;
    for (const row of rows) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(c => row[c]);
      
      try {
        await turso.execute({
          sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          args: values
        });
        count++;
      } catch (err) {
        console.error(`Error inserting into ${table}:`, err.message);
      }
    }
    console.log(`  -> Migrated ${count}/${rows.length} rows to ${table}.`);
  }

  console.log('Migration complete!');
  localDb.close();
}

migrate().catch(console.error);
