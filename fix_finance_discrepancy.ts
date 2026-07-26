import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db/index";
import { financeTransactions, invoices, journalEntries, journalLines } from "./src/lib/db/schema";
import { eq, ne, inArray } from "drizzle-orm";

async function fixDiscrepancies() {
  console.log("=== MEMULAI SINKRONISASI DATA KEUANGAN ===");
  try {
    // 1. Temukan dan update finance_transactions yang amount-nya tidak sama dengan grand_total invoice (karena diskon dll)
    const allInvoices = await db.select().from(invoices);
    let updatedCount = 0;
    
    for (const inv of allInvoices) {
      // Cari finance_transaction yang terkait dengan visitId dari invoice ini
      const finTx = await db.select()
        .from(financeTransactions)
        .where(eq(financeTransactions.referenceId, inv.visitId || ""))
        .limit(1);
        
      if (finTx.length > 0 && finTx[0].amount !== inv.grandTotal) {
        console.log(`Mengupdate transaksi (Visit ID: ${inv.visitId}): Rp ${finTx[0].amount} -> Rp ${inv.grandTotal}`);
        await db.update(financeTransactions)
          .set({ amount: inv.grandTotal })
          .where(eq(financeTransactions.id, finTx[0].id));
        
        // Update juga journal entries jika perlu (diabaikan untuk kemudahan skrip)
          
        updatedCount++;
      }
    }
    console.log(`Berhasil mengupdate ${updatedCount} transaksi yang berbeda karena diskon/edit.`);

    // 2. Hapus finance_transactions (Pemasukan) yang tidak memiliki invoice (karena invoice sudah dihapus sebelumnya tapi transaksi tertinggal)
    const validVisitIds = allInvoices.map(inv => inv.visitId);
    
    // Ambil semua transaksi INCOME yang memiliki referenceId (asumsi referenceId adalah visitId)
    // dan referenceId tersebut tidak ada di daftar validVisitIds
    const orphanedTxs = await db.select()
      .from(financeTransactions)
      .where(eq(financeTransactions.type, 'INCOME'));
      
    const txsToDelete = orphanedTxs.filter(tx => tx.referenceId && !validVisitIds.includes(tx.referenceId));
    
    if (txsToDelete.length > 0) {
      const idsToDelete = txsToDelete.map(tx => tx.id);
      console.log(`Menemukan ${idsToDelete.length} transaksi yatim (invoice sudah dihapus). Menghapus...`);
      
      // Hapus jurnal terkait transaksi yatim
      const relatedJournals = await db.select({ id: journalEntries.id })
        .from(journalEntries)
        .where(inArray(journalEntries.referenceId, idsToDelete));
      const journalIds = relatedJournals.map(j => j.id);

      if (journalIds.length > 0) {
        await db.delete(journalLines).where(inArray(journalLines.entryId, journalIds));
        await db.delete(journalEntries).where(inArray(journalEntries.id, journalIds));
      }
      
      // Hapus transaksi yatim
      await db.delete(financeTransactions).where(inArray(financeTransactions.id, idsToDelete));
      console.log(`Berhasil menghapus ${idsToDelete.length} transaksi yatim.`);
    } else {
      console.log("Tidak ada transaksi yatim yang perlu dihapus.");
    }

    console.log("=== SINKRONISASI SELESAI ===");
  } catch (err) {
    console.error("Terjadi kesalahan saat sinkronisasi:", err);
  }
  process.exit(0);
}

fixDiscrepancies();
