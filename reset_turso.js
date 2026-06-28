/**
 * reset_turso.js
 * Script untuk mereset semua data operasional di Turso (cloud).
 * Data yang DIHAPUS: pasien, kunjungan, keuangan, jurnal, komisi, invoice, absensi, dll.
 * Data yang DIPERTAHANKAN: cabang, layanan, terapis, admin, settings, akun akuntansi.
 */

const { createClient } = require("@libsql/client");
require("dotenv").config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function resetData() {
  console.log("=".repeat(60));
  console.log("  RESET DATA NAVARA REFLEXOLOGY - TURSO CLOUD");
  console.log("=".repeat(60));
  console.log(`  Database: ${process.env.TURSO_DATABASE_URL}`);
  console.log("=".repeat(60));
  console.log("");

  // Urutan hapus harus mengikuti dependency FK
  const tablesToDelete = [
    { table: "journal_lines",               label: "Jurnal Lines (Detail Debet/Kredit)" },
    { table: "journal_entries",             label: "Jurnal Entries (Header Jurnal)" },
    { table: "therapist_commissions",       label: "Komisi Terapis" },
    { table: "therapist_monthly_reports",   label: "Laporan Bulanan Terapis" },
    { table: "staff_payroll_reports",       label: "Slip Gaji Pegawai" },
    { table: "invoices",                    label: "Invoice / Struk Pembayaran" },
    { table: "patient_visits",             label: "Kunjungan Pasien" },
    { table: "reservations",               label: "Reservasi Online" },
    { table: "finance_transactions",        label: "Transaksi Keuangan" },
    { table: "attendance",                  label: "Absensi Karyawan" },
    { table: "inventory_transactions",      label: "Transaksi Inventaris" },
    { table: "monthly_targets",             label: "Target Bulanan KPI" },
    { table: "patients",                    label: "Data Pasien" },
  ];

  let totalDeleted = 0;

  for (const { table, label } of tablesToDelete) {
    try {
      // Cek jumlah data sebelum dihapus
      const countResult = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = countResult.rows[0].count;

      // Hapus semua data
      await client.execute(`DELETE FROM ${table}`);

      console.log(`  ✅ ${label.padEnd(40)} → ${count} baris dihapus`);
      totalDeleted += Number(count);
    } catch (error) {
      console.error(`  ❌ Gagal menghapus ${table}: ${error.message}`);
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log(`  ✅ RESET SELESAI! Total ${totalDeleted} baris data dihapus.`);
  console.log("");
  console.log("  Data yang DIPERTAHANKAN:");
  console.log("    • Cabang (branches)");
  console.log("    • Layanan (services)");
  console.log("    • Terapis (therapists)");
  console.log("    • Pegawai (staff)");
  console.log("    • Admin & Akun Login (admins)");
  console.log("    • Pengaturan Perusahaan (settings)");
  console.log("    • Akun Akuntansi (accounts)");
  console.log("    • Kategori Keuangan (finance_categories)");
  console.log("    • Item Inventaris (inventory_items)");
  console.log("    • Komisi Override (therapist_service_commissions)");
  console.log("=".repeat(60));
}

resetData()
  .then(() => {
    console.log("");
    console.log("  Script selesai.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n  ❌ ERROR FATAL:", err.message);
    process.exit(1);
  });
