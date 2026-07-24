import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sourceUrl = "postgresql://postgres.sjsrhuvcigxxhgjebatr:radjabekam2024@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const targetUrl = process.env.POSTGRES_URL;

if (!targetUrl) {
  throw new Error("Missing POSTGRES_URL in .env.local");
}

const sourcePool = new Pool({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const targetPool = new Pool({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });

async function migrateData() {
  console.log("Starting data migration from Radja Bekam to Maharaja Group...");

  // Get table names (excluding migrations table)
  const tablesResult = await sourcePool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name != '__drizzle_migrations'
  `);
  
  const tables = tablesResult.rows.map(r => r.table_name);
  
  // Order of insertion to respect foreign keys:
  // branches -> services, therapists, patients, users
  // therapists -> therapist_mutations
  // patients, therapists, branches -> visits
  // visits -> transactions, invoices
  const tableOrder = [
    "branches",
    "services",
    "therapists",
    "patients",
    "users", // if any admin
    "therapist_mutations",
    "patient_visits",
    "transactions",
    "invoices",
    "commissions",
    "attendance",
    "system_logs",
    "settings"
  ];

  // We only migrate tables that exist in both and respect the order
  const tablesToMigrate = tableOrder.filter(t => tables.includes(t));
  const otherTables = tables.filter(t => !tableOrder.includes(t));
  tablesToMigrate.push(...otherTables);

  try {
    for (const table of tablesToMigrate) {
      console.log(`Migrating table: ${table}...`);
      
      const { rows } = await sourcePool.query(`SELECT * FROM "${table}"`);
      if (rows.length === 0) {
        console.log(`- Skipping ${table} (0 rows)`);
        continue;
      }
      
      console.log(`- Found ${rows.length} rows in ${table}`);

      // Transform rows if necessary
      for (const row of rows) {
        if (table === "branches") {
          row.brand = "RADJA_BEKAM";
        }
        if (table === "patients") {
          delete row.branch_id;
        }
        if (table === "therapists" || table === "users" || table === "patient_visits" || table === "transactions") {
          // just standard copy
        }
      }

      // Insert data
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        const query = `
          INSERT INTO "${table}" ("${columns.join('", "')}") 
          VALUES (${placeholders}) 
          ON CONFLICT (id) DO NOTHING
        `;
        
        try {
          await targetPool.query(query, values);
        } catch (err: any) {
          if (err.code !== '23505') { // Ignore duplicate key
            console.error(`Error inserting into ${table}:`, err.message);
          }
        }
      }
      console.log(`- Completed ${table}`);
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

migrateData();
