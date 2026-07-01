import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/lib/db/schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });
const sqliteDb = new Database("local.db", { readonly: true });

function snakeToCamel(str: string) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function mapKeys(row: any) {
  const newRow: any = {};
  for (const key of Object.keys(row)) {
    newRow[snakeToCamel(key)] = row[key];
  }
  return newRow;
}

async function restore() {
  console.log("Memulai proses restore data keuangan dari SQLite (local.db) ke PostgreSQL (Supabase)...");

  try {
    // 1. Restore finance_transactions
    console.log("Membaca finance_transactions dari SQLite...");
    const ftRows = sqliteDb.prepare("SELECT * FROM finance_transactions").all().map(mapKeys);
    if (ftRows.length > 0) {
      console.log(`Mengembalikan ${ftRows.length} baris finance_transactions...`);
      await db.insert(schema.financeTransactions).values(ftRows).onConflictDoNothing();
    }

    // 2. Restore invoices
    console.log("Membaca invoices dari SQLite...");
    const invoiceRows = sqliteDb.prepare("SELECT * FROM invoices").all().map(mapKeys);
    if (invoiceRows.length > 0) {
      console.log(`Mengembalikan ${invoiceRows.length} baris invoices...`);
      await db.insert(schema.invoices).values(invoiceRows).onConflictDoNothing();
    }

    // 3. Restore staff_payroll_reports
    console.log("Membaca staff_payroll_reports dari SQLite...");
    const payrollRows = sqliteDb.prepare("SELECT * FROM staff_payroll_reports").all().map(mapKeys);
    if (payrollRows.length > 0) {
      console.log(`Mengembalikan ${payrollRows.length} baris staff_payroll_reports...`);
      await db.insert(schema.staffPayrollReports).values(payrollRows).onConflictDoNothing();
    }

    // 4. Restore therapist_monthly_reports
    console.log("Membaca therapist_monthly_reports dari SQLite...");
    const tmRows = sqliteDb.prepare("SELECT * FROM therapist_monthly_reports").all().map(mapKeys);
    if (tmRows.length > 0) {
      console.log(`Mengembalikan ${tmRows.length} baris therapist_monthly_reports...`);
      await db.insert(schema.therapistMonthlyReports).values(tmRows).onConflictDoNothing();
    }

    // 5. Restore therapist_commissions
    console.log("Membaca therapist_commissions dari SQLite...");
    const tcRows = sqliteDb.prepare("SELECT * FROM therapist_commissions").all().map(mapKeys);
    if (tcRows.length > 0) {
      console.log(`Mengembalikan ${tcRows.length} baris therapist_commissions...`);
      await db.insert(schema.therapistCommissions).values(tcRows).onConflictDoNothing();
    }

    // 6. Restore journal_entries
    console.log("Membaca journal_entries dari SQLite...");
    const jeRows = sqliteDb.prepare("SELECT * FROM journal_entries").all().map(mapKeys);
    if (jeRows.length > 0) {
      console.log(`Mengembalikan ${jeRows.length} baris journal_entries...`);
      await db.insert(schema.journalEntries).values(jeRows).onConflictDoNothing();
    }

    // 7. Restore journal_lines
    console.log("Membaca journal_lines dari SQLite...");
    const jlRows = sqliteDb.prepare("SELECT * FROM journal_lines").all().map(mapKeys);
    if (jlRows.length > 0) {
      console.log(`Mengembalikan ${jlRows.length} baris journal_lines...`);
      await db.insert(schema.journalLines).values(jlRows).onConflictDoNothing();
    }

    console.log("✅ Restore data keuangan berhasil!");
  } catch (error) {
    console.error("❌ Gagal restore:", error);
  } finally {
    sqliteDb.close();
    await pool.end();
  }
}

restore();
