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
  MODAL: "acc_301",
  PENDAPATAN_LAYANAN: "acc_401",
  PENDAPATAN_LAIN: "acc_402",
  BEBAN_KOMISI: "acc_501",
  HPP_BARANG: "acc_502",
  BEBAN_OPERASIONAL: "acc_601",
  BEBAN_GAJI: "acc_602",
};
