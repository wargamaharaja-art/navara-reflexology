import { db } from "@/lib/db";
import { 
  patientVisits, 
  therapistCommissions, 
  invoices,
  financeTransactions,
  journalEntries,
  journalLines,
  therapistMonthlyReports
} from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { logSystemAction } from "@/lib/logger";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Dapatkan data visit sebelum dihapus
    const visitsRecords = await db.select().from(patientVisits).where(eq(patientVisits.id, id)).limit(1);
    if (visitsRecords.length === 0) {
      return Response.json({ error: "Data kunjungan tidak ditemukan" }, { status: 404 });
    }
    const visit = visitsRecords[0];

    // 2. Dapatkan data komisi terapis yang terkait
    const commissions = await db.select().from(therapistCommissions).where(eq(therapistCommissions.visitId, id));

    // 3. Update Laporan Bulanan Terapis (sinkronisasi manual dihapus, Single Source of Truth)

    // 4. Dapatkan invoice terkait untuk menghapus transaksi keuangan dari POS
    const relatedInvoices = await db.select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.visitId, id));
    
    const invoiceIds = relatedInvoices.map(inv => inv.id);

    // 5. Hapus data keuangan dan jurnal yang terkait
    // Transaksi keuangan bisa mereferensikan visitId (dari /pay) atau invoiceId (dari POS)
    const referenceIdsToSearch = [id, ...invoiceIds];

    const relatedFinanceTxs = await db.select({ id: financeTransactions.id })
      .from(financeTransactions)
      .where(inArray(financeTransactions.referenceId, referenceIdsToSearch));

    const financeTxIds = relatedFinanceTxs.map(tx => tx.id);

    if (financeTxIds.length > 0) {
      const relatedJournals = await db.select({ id: journalEntries.id })
        .from(journalEntries)
        .where(inArray(journalEntries.referenceId, financeTxIds));
      
      const journalIds = relatedJournals.map(j => j.id);
      
      if (journalIds.length > 0) {
        await db.delete(journalLines).where(inArray(journalLines.entryId, journalIds));
        await db.delete(journalEntries).where(inArray(journalEntries.id, journalIds));
      }

      await db.delete(financeTransactions).where(inArray(financeTransactions.id, financeTxIds));
    }

    // 6. Optional: Delete related therapist commissions first to avoid foreign key constraints errors
    // Since we don't have ON DELETE CASCADE set up in schema.ts
    await db.delete(therapistCommissions).where(eq(therapistCommissions.visitId, id));
    
    // 7. Also delete related invoices to avoid foreign key constraint errors
    if (invoiceIds.length > 0) {
      await db.delete(invoices).where(inArray(invoices.id, invoiceIds));
    }

    // 8. Then delete the visit
    await db.delete(patientVisits).where(eq(patientVisits.id, id));

    await logSystemAction("DELETE_VISIT", "patient_visit", id, `Kunjungan dihapus (ID: ${id}) beserta seluruh struk dan jurnal yang berkaitan.`);

    return Response.json({ success: true, message: "Data kunjungan dan transaksi terkait berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/patient-visits/[id] error:", error);
    return Response.json({ error: "Gagal menghapus data kunjungan" }, { status: 500 });
  }
}
