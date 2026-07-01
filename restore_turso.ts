import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/lib/db/schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

function snakeToCamel(str: string) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function mapKeys(row: any) {
  const newRow: any = {};
  for (const key of Object.keys(row)) {
    if (isNaN(Number(key))) { // hindari key index numerik dari libsql
      newRow[snakeToCamel(key)] = row[key] === null ? null : row[key];
    }
  }
  return newRow;
}

async function restore() {
  console.log("Memulai proses restore data keuangan dari TURSO CLOUD ke PostgreSQL (Supabase)...");

  try {
    // 1. Restore finance_transactions
    console.log("Membaca finance_transactions dari Turso...");
    const ftRes = await turso.execute("SELECT * FROM finance_transactions");
    if (ftRes.rows.length > 0) {
      const ftRows = ftRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${ftRows.length} baris finance_transactions...`);
      await db.insert(schema.financeTransactions).values(ftRows).onConflictDoNothing();
    }

    // 2. Restore invoices
    console.log("Membaca invoices dari Turso...");
    const invRes = await turso.execute("SELECT * FROM invoices");
    if (invRes.rows.length > 0) {
      const invoiceRows = invRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${invoiceRows.length} baris invoices...`);
      await db.insert(schema.invoices).values(invoiceRows).onConflictDoNothing();
    }

    // 3. Restore staff_payroll_reports
    console.log("Membaca staff_payroll_reports dari Turso...");
    const prRes = await turso.execute("SELECT * FROM staff_payroll_reports");
    if (prRes.rows.length > 0) {
      const payrollRows = prRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${payrollRows.length} baris staff_payroll_reports...`);
      await db.insert(schema.staffPayrollReports).values(payrollRows).onConflictDoNothing();
    }

    // 4. Restore therapist_monthly_reports
    console.log("Membaca therapist_monthly_reports dari Turso...");
    const tmRes = await turso.execute("SELECT * FROM therapist_monthly_reports");
    if (tmRes.rows.length > 0) {
      const tmRows = tmRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${tmRows.length} baris therapist_monthly_reports...`);
      await db.insert(schema.therapistMonthlyReports).values(tmRows).onConflictDoNothing();
    }

    // 5. Restore therapist_commissions
    console.log("Membaca therapist_commissions dari Turso...");
    const tcRes = await turso.execute("SELECT * FROM therapist_commissions");
    if (tcRes.rows.length > 0) {
      const tcRows = tcRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${tcRows.length} baris therapist_commissions...`);
      await db.insert(schema.therapistCommissions).values(tcRows).onConflictDoNothing();
    }

    // 6. Restore journal_entries
    console.log("Membaca journal_entries dari Turso...");
    const jeRes = await turso.execute("SELECT * FROM journal_entries");
    if (jeRes.rows.length > 0) {
      const jeRows = jeRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${jeRows.length} baris journal_entries...`);
      await db.insert(schema.journalEntries).values(jeRows).onConflictDoNothing();
    }

    // 7. Restore journal_lines
    console.log("Membaca journal_lines dari Turso...");
    const jlRes = await turso.execute("SELECT * FROM journal_lines");
    if (jlRes.rows.length > 0) {
      const jlRows = jlRes.rows.map(mapKeys);
      console.log(`Mengembalikan ${jlRows.length} baris journal_lines...`);
      await db.insert(schema.journalLines).values(jlRows).onConflictDoNothing();
    }

    console.log("✅ Restore data keuangan dari Turso berhasil!");
  } catch (error) {
    console.error("❌ Gagal restore:", error);
  } finally {
    await pool.end();
  }
}

restore();
