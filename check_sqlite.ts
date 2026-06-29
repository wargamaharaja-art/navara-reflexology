import Database from "better-sqlite3";

function checkDb(file: string) {
  try {
    const db = new Database(file, { readonly: true });
    
    // Check if tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const tableNames = tables.map(t => t.name);
    
    console.log(`\n--- Checking ${file} ---`);
    console.log("Tables:", tableNames.join(", "));
    
    if (tableNames.includes("finance_transactions")) {
      const financeCount = db.prepare("SELECT count(*) as count FROM finance_transactions").get() as any;
      console.log("finance_transactions count:", financeCount.count);
    }
    if (tableNames.includes("invoices")) {
      const invoicesCount = db.prepare("SELECT count(*) as count FROM invoices").get() as any;
      console.log("invoices count:", invoicesCount.count);
    }
    
    db.close();
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
}

checkDb("local.db");
checkDb("sqlite.db");
checkDb("src/lib/db/radja-bekam.sqlite");
