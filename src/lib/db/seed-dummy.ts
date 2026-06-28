import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("./index");
import { therapists, patients, patientVisits, financeCategories } from "./schema";

async function seedDummyData() {
  console.log("🌱 Menambahkan data dummy...");

  // 1. Terapis
  await db.insert(therapists).values([
    {
      id: "therapist-1",
      name: "Budi Santoso",
      specialization: "Bekam & Pijat",
      phone: "081234567891",
      gender: "L",
      baseSalary: 2000000,
      commissionRate: 30,
      branchId: "karawaci",
      isActive: true,
    },
    {
      id: "therapist-2",
      name: "Siti Aminah",
      specialization: "Pijat Refleksi",
      phone: "081234567892",
      gender: "P",
      baseSalary: 2000000,
      commissionRate: 30,
      branchId: "karawaci",
      isActive: true,
    }
  ]).onConflictDoNothing();

  // 2. Kategori Finansial
  await db.insert(financeCategories).values([
    { id: "cat-1", name: "Pendapatan Terapi", type: "INCOME" },
    { id: "cat-2", name: "Biaya Operasional", type: "EXPENSE" },
    { id: "cat-3", name: "Gaji Terapis", type: "EXPENSE" }
  ]).onConflictDoNothing();

  // 3. Pasien
  await db.insert(patients).values([
    {
      id: "patient-1",
      name: "Ahmad Dahlan",
      phone: "08111222333",
      address: "Jl. Merdeka No 1",
      gender: "L"
    },
    {
      id: "patient-2",
      name: "Rina Wati",
      phone: "08222333444",
      address: "Jl. Sudirman No 2",
      gender: "P"
    }
  ]).onConflictDoNothing();

  // 4. Kunjungan Pasien
  await db.insert(patientVisits).values([
    {
      id: "visit-1",
      patientId: "patient-1",
      serviceId: "bekam-sunnah",
      branchId: "karawaci",
      therapistId: "therapist-1",
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: "10:00",
      status: "completed",
      paymentStatus: "PAID",
      notes: "Keluhan pegal linu"
    }
  ]).onConflictDoNothing();

  console.log("✅ Data dummy berhasil ditambahkan!");
}

seedDummyData().catch((err) => {
  console.error("❌ Gagal:", err);
  process.exit(1);
});
