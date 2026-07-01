import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkTurso() {
  try {
    console.log("Menghubungkan ke Turso Database...");
    
    const ftRes = await turso.execute("SELECT count(*) as count, sum(amount) as total FROM finance_transactions WHERE type='INCOME'");
    console.log("Finance Transactions (Turso):");
    console.log(ftRes.rows);

    const invRes = await turso.execute("SELECT count(*) as count, sum(grand_total) as total FROM invoices");
    console.log("Invoices (Turso):");
    console.log(invRes.rows);

  } catch (error) {
    console.error("Gagal terhubung ke Turso:", error);
  }
}

checkTurso();
