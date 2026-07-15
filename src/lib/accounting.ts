import { db } from "@/lib/db";
import { journalEntries, journalLines, accounts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Helper to automatically create a double-entry journal record
 */
export async function createJournalEntry({
  date,
  description,
  referenceId,
  debitAccountId,
  creditAccountId,
  amount,
  tx
}: {
  date?: string;
  description: string;
  referenceId?: string;
  debitAccountId: string; // Akun yang di-debet (bertambah jika Aset/Beban)
  creditAccountId: string; // Akun yang di-kredit (bertambah jika Kewajiban/Modal/Pendapatan)
  amount: number;
  tx?: any; // Drizzle transaction instance
}) {
  const jId = "jrn_" + Math.random().toString(36).substr(2, 9);
  const trxDate = date || new Date().toISOString();

  const dbInstance = tx || db;

  // Ensure accounts exist to prevent foreign key errors
  const defaultAccounts: Record<string, { name: string, type: string, code: string }> = {
    [COA.KAS]: { name: "Kas & Bank", type: "ASSET", code: "101" },
    [COA.PERSEDIAAN]: { name: "Persediaan", type: "ASSET", code: "102" },
    [COA.HUTANG]: { name: "Hutang Usaha", type: "LIABILITY", code: "201" },
    [COA.HUTANG_KOMISI]: { name: "Hutang Komisi", type: "LIABILITY", code: "202" },
    [COA.MODAL]: { name: "Modal", type: "EQUITY", code: "301" },
    [COA.PENDAPATAN_LAYANAN]: { name: "Pendapatan Layanan", type: "REVENUE", code: "401" },
    [COA.PENDAPATAN_LAIN]: { name: "Pendapatan Lain", type: "REVENUE", code: "402" },
    [COA.BEBAN_KOMISI]: { name: "Beban Komisi", type: "EXPENSE", code: "501" },
    [COA.HPP_BARANG]: { name: "Harga Pokok Penjualan", type: "COGS", code: "502" },
    [COA.BEBAN_OPERASIONAL]: { name: "Beban Operasional", type: "EXPENSE", code: "601" },
    [COA.BEBAN_GAJI]: { name: "Beban Gaji", type: "EXPENSE", code: "602" },
  };

  for (const accId of [debitAccountId, creditAccountId]) {
    const def = defaultAccounts[accId];
    if (def) {
      try {
        await dbInstance.insert(accounts).values({
          id: accId,
          code: def.code,
          name: def.name,
          type: def.type as any,
          isActive: true
        }).onConflictDoNothing();
      } catch (e) {
        // Fallback catch just in case, but onConflictDoNothing should prevent standard unique constraint errors
        console.warn("Failed to insert account:", e);
      }
    }
  }

  await dbInstance.insert(journalEntries).values({
    id: jId,
    date: trxDate,
    description,
    referenceId,
    createdAt: trxDate,
  });

  await dbInstance.insert(journalLines).values([
    {
      id: "jline_" + Math.random().toString(36).substr(2, 9),
      entryId: jId,
      accountId: debitAccountId,
      debit: amount,
      credit: 0
    },
    {
      id: "jline_" + Math.random().toString(36).substr(2, 9),
      entryId: jId,
      accountId: creditAccountId,
      debit: 0,
      credit: amount
    }
  ]);

  return jId;
}

// Common Account Constants (Standard CoA IDs)
export const COA = {
  KAS: "acc_101",
  PERSEDIAAN: "acc_102",
  HUTANG: "acc_201",
  HUTANG_KOMISI: "acc_202",
  MODAL: "acc_301",
  PENDAPATAN_LAYANAN: "acc_401",
  PENDAPATAN_LAIN: "acc_402",
  BEBAN_KOMISI: "acc_501",
  HPP_BARANG: "acc_502",
  BEBAN_OPERASIONAL: "acc_601",
  BEBAN_GAJI: "acc_602",
};
