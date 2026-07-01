import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/lib/db/schema";
import { COA } from "./src/lib/accounting";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

async function generate() {
  console.log("Memulai proses pembuatan data dummy senilai ~Rp 4.000.000...");

  try {
    const branchRecords = await db.select().from(schema.branches).where(schema.branches.isActive);
    if (branchRecords.length === 0) {
      throw new Error("Tidak ada cabang aktif yang ditemukan!");
    }
    const branch = branchRecords[0]; // Pakai cabang pertama (Navara Pusat)

    const serviceRecords = await db.select().from(schema.services).where(schema.services.isActive);
    if (serviceRecords.length === 0) {
      throw new Error("Tidak ada layanan aktif yang ditemukan!");
    }
    
    // Pastikan kita tidak pakai layanan yang harganya 0 (Bekam Gratis) untuk mempercepat capai target
    const paidServices = serviceRecords.filter(s => s.price > 0);
    if (paidServices.length === 0) {
      throw new Error("Tidak ada layanan berbayar yang ditemukan!");
    }

    const therapistRecords = await db.select().from(schema.therapists).where(schema.therapists.isActive);
    
    // Setup patient dummy
    const patientId = "P-DUMMY";
    const patientName = "Pasien Dummy 4Jt";
    const patientPhone = "081234567890";
    
    // Pastikan pasien dummy ada
    await db.insert(schema.patients).values({
      id: patientId,
      name: patientName,
      phone: patientPhone,
    }).onConflictDoNothing();

    const targetTotal = 4100000;
    let currentTotal = 0;
    let invoiceCount = 0;

    const dateStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(/-/g, "");
    const branchCode = branch.name.substring(0, 3).toUpperCase();
    const prefix = `INV-${branchCode}-${dateStr}`;

    console.log(`Menggunakan cabang: ${branch.name}`);

    while (currentTotal < targetTotal) {
      invoiceCount++;
      // Randomly pick 1-2 services
      const numServices = Math.floor(Math.random() * 2) + 1;
      const selectedServices = [];
      let subtotal = 0;
      
      for(let i=0; i<numServices; i++) {
        const s = paidServices[Math.floor(Math.random() * paidServices.length)];
        selectedServices.push({
          serviceId: s.id,
          name: s.name,
          qty: 1,
          price: s.price,
          subtotal: s.price
        });
        subtotal += s.price;
      }

      // 5% chance of discount
      const discount = Math.random() < 0.05 ? 10000 : 0;
      const grandTotal = subtotal - discount;

      const invoiceNumber = `${prefix}-9${invoiceCount.toString().padStart(3, "0")}`;
      const invoiceId = crypto.randomUUID();
      const now = new Date().toISOString();

      let therapistId = null;
      let therapistName = null;
      if (therapistRecords.length > 0) {
        const t = therapistRecords[Math.floor(Math.random() * therapistRecords.length)];
        therapistId = t.id;
        therapistName = t.name;
      }

      // Insert Patient Visit
      const visitId = `V-DUMMY-${invoiceCount}-${Date.now()}`;
      await db.insert(schema.patientVisits).values({
        id: visitId,
        patientId,
        serviceId: selectedServices[0].serviceId,
        branchId: branch.id,
        therapistId: therapistId,
        visitDate: now.split("T")[0],
        visitTime: "12:00",
        notes: `Dummy Transaction`,
        status: "completed",
        paymentStatus: "PAID",
      });

      // Insert Invoice
      await db.insert(schema.invoices).values({
        id: invoiceId,
        invoiceNumber,
        visitId,
        patientId,
        patientName,
        patientPhone,
        therapistId,
        therapistName,
        branchId: branch.id,
        branchName: branch.name,
        branchAddress: branch.address,
        branchPhone: branch.phone,
        items: JSON.stringify(selectedServices),
        subtotal,
        discount,
        tax: 0,
        grandTotal,
        paymentMethod: "CASH",
        amountPaid: grandTotal,
        changeAmount: 0,
        createdAt: now,
      });

      // Insert Finance Transaction (Income)
      const finTrxId = crypto.randomUUID();
      await db.insert(schema.financeTransactions).values({
        id: finTrxId,
        type: "INCOME",
        category: "Pendapatan Layanan",
        amount: grandTotal,
        description: `Struk ${invoiceNumber} - ${patientName}`,
        referenceId: invoiceId,
        branchId: branch.id,
        paymentMethod: "CASH",
        date: now,
      });

      // Insert Journal Entry (Kas ++, Pendapatan ++)
      const jId = "jrn_" + Math.random().toString(36).substr(2, 9);
      await db.insert(schema.journalEntries).values({
        id: jId,
        date: now,
        description: `[POS] ${invoiceNumber} - ${patientName}`,
        referenceId: finTrxId,
        createdAt: now,
      });
      await db.insert(schema.journalLines).values([
        { id: "jline_" + Math.random().toString(36).substr(2, 9), entryId: jId, accountId: COA.KAS, debit: grandTotal, credit: 0 },
        { id: "jline_" + Math.random().toString(36).substr(2, 9), entryId: jId, accountId: COA.PENDAPATAN_LAYANAN, debit: 0, credit: grandTotal }
      ]);

      // Calculate Therapist Commissions (assume 20,000 per service if no specific rate is found)
      if (therapistId) {
        for (const item of selectedServices) {
          const commissionAmount = 20000;
          await db.insert(schema.therapistCommissions).values({
            id: crypto.randomUUID(),
            therapistId,
            visitId,
            amount: commissionAmount,
            status: "PENDING",
          });

          // Insert Finance Transaction (Expense)
          const commTrxId = crypto.randomUUID();
          await db.insert(schema.financeTransactions).values({
            id: commTrxId,
            type: "EXPENSE",
            category: "Bagi Hasil Terapis",
            amount: commissionAmount,
            description: `Bagi Hasil Terapis (${therapistName}) untuk ${item.name}`,
            referenceId: visitId,
            branchId: branch.id,
            paymentMethod: "CASH",
            date: now
          });

          // Insert Journal Entry (Beban Komisi ++, Kas --)
          const cjId = "jrn_" + Math.random().toString(36).substr(2, 9);
          await db.insert(schema.journalEntries).values({
            id: cjId,
            date: now,
            description: `[Auto] Beban Bagi Hasil Terapis: ${therapistName}`,
            referenceId: commTrxId,
            createdAt: now,
          });
          await db.insert(schema.journalLines).values([
            { id: "jline_" + Math.random().toString(36).substr(2, 9), entryId: cjId, accountId: COA.BEBAN_KOMISI, debit: commissionAmount, credit: 0 },
            { id: "jline_" + Math.random().toString(36).substr(2, 9), entryId: cjId, accountId: COA.KAS, debit: 0, credit: commissionAmount }
          ]);
        }
      }

      currentTotal += grandTotal;
      if (invoiceCount % 10 === 0) {
        console.log(`Generated ${invoiceCount} invoices... Current Total: Rp ${currentTotal.toLocaleString('id-ID')}`);
      }
    }

    console.log(`✅ Selesai! Berhasil membuat ${invoiceCount} struk transaksi dengan Total Pendapatan Rp ${currentTotal.toLocaleString('id-ID')}.`);

  } catch (error) {
    console.error("❌ Gagal membuat data dummy:", error);
  } finally {
    await pool.end();
  }
}

generate();
