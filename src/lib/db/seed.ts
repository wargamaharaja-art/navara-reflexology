import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("./index");
import { branches, services, settings, accounts } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ---- Seed Branches ----
  await db.insert(branches).values([
    {
      id: "karawaci",
      name: "Radja Bekam Karawaci",
      address: "Jl. Beringin Raya No. 123, Karawaci, Tangerang",
      phone: "+62 812-3456-7890",
      whatsappNumber: "6281234567890",
      operatingHours: "09:00 - 21:00 WIB",
      mapUrl: "https://maps.google.com/maps?q=Radja+Bekam+Karawaci,+Tangerang&t=&z=15&ie=UTF8&iwloc=&output=embed",
      isActive: true,
    },
    {
      id: "duren-sawit",
      name: "Radja Bekam Duren Sawit",
      address: "Jl. Radin Inten II No. 45, Duren Sawit, Jakarta Timur",
      phone: "+62 812-3456-7891",
      whatsappNumber: "6281234567891",
      operatingHours: "09:00 - 21:00 WIB",
      mapUrl: "https://maps.google.com/maps?q=Duren+Sawit,+Jakarta+Timur&t=&z=15&ie=UTF8&iwloc=&output=embed",
      isActive: true,
    },
    {
      id: "mustika-jaya",
      name: "Radja Bekam Mustika Jaya",
      address: "Jl. Raya Mustika Jaya No. 88, Bekasi Timur",
      phone: "+62 812-3456-7892",
      whatsappNumber: "6281234567892",
      operatingHours: "09:00 - 21:00 WIB",
      mapUrl: "https://maps.google.com/maps?q=Mustika+Jaya,+Bekasi&t=&z=15&ie=UTF8&iwloc=&output=embed",
      isActive: true,
    },
    {
      id: "karangsatria",
      name: "Radja Bekam Karangsatria",
      address: "Jl. Raya Karangsatria No. 55, Tambun Utara, Bekasi",
      phone: "+62 812-3456-7893",
      whatsappNumber: "6281234567893",
      operatingHours: "09:00 - 21:00 WIB",
      isActive: true,
    },
    {
      id: "jatibening",
      name: "Radja Bekam Jatibening",
      address: "Jl. Raya Jatibening No. 10, Pondok Gede, Bekasi",
      phone: "+62 812-3456-7894",
      whatsappNumber: "6281234567894",
      operatingHours: "09:00 - 21:00 WIB",
      isActive: false, // Coming soon
    },
  ]).onConflictDoNothing();

  console.log("✅ Branches seeded");

  // ---- Seed Services ----
  await db.insert(services).values([
    // Removed 3 treatments
  ]).onConflictDoNothing();

  console.log("✅ Services seeded");

  // ---- Seed Settings ----
  await db.insert(settings).values([
    {
      id: "company_info",
      companyName: "Radja Bekam",
      description: "Solusi Teman Sehatku. Pengobatan sunnah dengan standar profesional dan klinis.",
      address: "Jl Sehat No. 123, Jakarta",
      phone: "+62 812 3456 7890",
      email: "info@radjabekam.com",
      whatsappNumber: "6281234567890",
      facebookUrl: "https://facebook.com/radjabekam",
      instagramUrl: "https://instagram.com/radjabekam",
      youtubeUrl: "https://youtube.com/@radjabekam",
      heroBadgeText: "TERPERCAYA & PROFESIONAL",
      heroTitle: "Solusi Teman Sehatku",
      heroDescription: "Menghadirkan layanan pengobatan sunnah berkualitas tinggi dengan standar medis modern. Temukan ketenangan dan kesembuhan alami di tangan terapis ahli kami.",
    }
  ]).onConflictDoNothing();

  console.log("✅ Settings seeded");

  // ---- Seed Accounts (Chart of Accounts) ----
  await db.insert(accounts).values([
    { id: "acc_101", code: "101", name: "Kas & Bank", type: "ASSET", isActive: true },
    { id: "acc_102", code: "102", name: "Persediaan", type: "ASSET", isActive: true },
    { id: "acc_201", code: "201", name: "Hutang", type: "LIABILITY", isActive: true },
    { id: "acc_301", code: "301", name: "Modal", type: "EQUITY", isActive: true },
    { id: "acc_401", code: "401", name: "Pendapatan Layanan", type: "REVENUE", isActive: true },
    { id: "acc_402", code: "402", name: "Pendapatan Lain", type: "REVENUE", isActive: true },
    { id: "acc_501", code: "501", name: "Beban Komisi", type: "EXPENSE", isActive: true },
    { id: "acc_502", code: "502", name: "HPP Barang", type: "COGS", isActive: true },
    { id: "acc_601", code: "601", name: "Beban Operasional", type: "EXPENSE", isActive: true },
    { id: "acc_602", code: "602", name: "Beban Gaji", type: "EXPENSE", isActive: true },
  ]).onConflictDoNothing();

  console.log("✅ Accounts seeded");

  console.log("🎉 Database seeded successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
