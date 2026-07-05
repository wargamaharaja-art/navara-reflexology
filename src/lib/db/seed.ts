import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("./index");
import { branches, services, settings, accounts } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ---- Seed Branches ----
  await db.insert(branches).values([
    {
      id: "kelapa-dua",
      name: "Navara Kelapa Dua",
      address: "Kelapa Dua, Depok",
      phone: "+62",
      whatsappNumber: "62",
      operatingHours: "09:00 - 21:00 WIB",
      mapUrl: "",
      isActive: true,
    }
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
      companyName: "Navara Reflexology",
      description: "Pusat Reflexology terbaik.",
      address: "Depok",
      phone: "+62",
      email: "info@navara.com",
      whatsappNumber: "62",
      facebookUrl: "",
      instagramUrl: "",
      youtubeUrl: "",
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
