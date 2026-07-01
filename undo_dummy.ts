import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

async function undo() {
  console.log("Membatalkan (undo) pembuatan data dummy 4 juta...");
  
  try {
    // Cari semua invoice dari pasien dummy
    const dummyInvoices = await db.select().from(schema.invoices).where(eq(schema.invoices.patientId, "P-DUMMY"));
    
    if (dummyInvoices.length > 0) {
      const invoiceIds = dummyInvoices.map(i => i.id);
      
      // Cari kunjungan dummy
      const dummyVisits = await db.select().from(schema.patientVisits).where(eq(schema.patientVisits.patientId, "P-DUMMY"));
      const visitIds = dummyVisits.map(v => v.id);
      
      // Kumpulkan ID referensi untuk mencari transaksi keuangan
      const refIds = [...invoiceIds, ...visitIds];
      
      let finTrxIds: string[] = [];
      if (refIds.length > 0) {
        const finTrx = await db.select().from(schema.financeTransactions).where(inArray(schema.financeTransactions.referenceId, refIds));
        finTrxIds = finTrx.map(f => f.id);
      }
      
      let entryIds: string[] = [];
      if (finTrxIds.length > 0) {
        const entries = await db.select().from(schema.journalEntries).where(inArray(schema.journalEntries.referenceId, finTrxIds));
        entryIds = entries.map(e => e.id);
      }
      
      // 1. Hapus journal_lines
      if (entryIds.length > 0) {
         console.log(`Menghapus ${entryIds.length} jurnal...`);
         await db.delete(schema.journalLines).where(inArray(schema.journalLines.entryId, entryIds));
         await db.delete(schema.journalEntries).where(inArray(schema.journalEntries.id, entryIds));
      }
      
      // 2. Hapus finance_transactions
      if (finTrxIds.length > 0) {
         console.log(`Menghapus ${finTrxIds.length} transaksi kas...`);
         await db.delete(schema.financeTransactions).where(inArray(schema.financeTransactions.id, finTrxIds));
      }
      
      // 3. Hapus komisi
      if (visitIds.length > 0) {
         console.log(`Menghapus komisi terapis...`);
         await db.delete(schema.therapistCommissions).where(inArray(schema.therapistCommissions.visitId, visitIds));
      }
      
      // 4. Hapus invoices & visits
      console.log(`Menghapus ${invoiceIds.length} struk...`);
      await db.delete(schema.invoices).where(inArray(schema.invoices.id, invoiceIds));
      
      if (visitIds.length > 0) {
         await db.delete(schema.patientVisits).where(inArray(schema.patientVisits.id, visitIds));
      }
      
      // 5. Hapus pasien dummy
      await db.delete(schema.patients).where(eq(schema.patients.id, "P-DUMMY"));
      
      console.log("✅ Berhasil membatalkan (undo) data dummy!");
    } else {
      console.log("Tidak ada data dummy 'P-DUMMY' yang ditemukan.");
    }
  } catch (err) {
    console.error("❌ Gagal undo:", err);
  } finally {
    await pool.end();
  }
}

undo();
