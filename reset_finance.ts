import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/lib/db/schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

async function resetFinance() {
  console.log("Memulai proses reset sistem keuangan ke 0...");
  
  try {
    console.log("Menghapus data journal_lines...");
    await db.delete(schema.journalLines);

    console.log("Menghapus data journal_entries...");
    await db.delete(schema.journalEntries);

    console.log("Menghapus data therapist_commissions...");
    await db.delete(schema.therapistCommissions);

    console.log("Menghapus data therapist_monthly_reports...");
    await db.delete(schema.therapistMonthlyReports);

    console.log("Menghapus data staff_payroll_reports...");
    await db.delete(schema.staffPayrollReports);

    console.log("Menghapus data invoices (struk transaksi)...");
    await db.delete(schema.invoices);

    console.log("Menghapus data finance_transactions (buku kas)...");
    await db.delete(schema.financeTransactions);

    console.log("✅ Sistem keuangan berhasil di-reset menjadi 0!");
    console.log("Catatan: Data cabang, terapis, pasien, reservasi, dan absensi (sistem lainnya) TETAP AMAN dan TIDAK DIUBAH.");
  } catch (error) {
    console.error("❌ Gagal melakukan reset sistem keuangan:", error);
  } finally {
    await pool.end();
  }
}

resetFinance();
