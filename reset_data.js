const Database = require('better-sqlite3');
const db = new Database('local.db');

console.log("Memulai proses reset data sistem...");

try {
  // Gunakan transaksi agar aman
  db.transaction(() => {
    console.log("Menghapus journal_lines...");
    db.prepare("DELETE FROM journal_lines").run();

    console.log("Menghapus journal_entries...");
    db.prepare("DELETE FROM journal_entries").run();

    console.log("Menghapus finance_transactions...");
    db.prepare("DELETE FROM finance_transactions").run();

    console.log("Menghapus therapist_commissions...");
    db.prepare("DELETE FROM therapist_commissions").run();

    console.log("Menghapus therapist_monthly_reports...");
    db.prepare("DELETE FROM therapist_monthly_reports").run();

    console.log("Menghapus invoices...");
    db.prepare("DELETE FROM invoices").run();

    console.log("Menghapus patient_visits...");
    db.prepare("DELETE FROM patient_visits").run();

    console.log("Menghapus reservations...");
    db.prepare("DELETE FROM reservations").run();

    console.log("Menghapus attendance...");
    db.prepare("DELETE FROM attendance").run();

    console.log("Menghapus patients...");
    db.prepare("DELETE FROM patients").run();
  })();
  
  console.log("PROSES RESET BERHASIL! Seluruh data operasional dan keuangan telah dikosongkan.");
} catch (error) {
  console.error("Gagal melakukan reset:", error.message);
}
