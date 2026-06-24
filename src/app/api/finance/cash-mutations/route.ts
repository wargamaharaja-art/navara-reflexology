import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions } from "@/lib/db/schema";
import { desc, eq, and, ne } from "drizzle-orm";
import { createJournalEntry, COA } from "@/lib/accounting";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchFilter = await getActiveBranchFilter();
    const branch = branchFilter || searchParams.get("branchId");

    const conditions: any[] = [
      eq(financeTransactions.paymentMethod, "CASH"),
      ne(financeTransactions.category, "Bagi Hasil Terapis")
    ];
    if (branch) {
      conditions.push(eq(financeTransactions.branchId, branch));
    }

    const result = await db
      .select()
      .from(financeTransactions)
      .where(and(...conditions))
      .orderBy(desc(financeTransactions.date));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/finance/cash-mutations error:", error);
    return NextResponse.json({ error: "Gagal memuat mutasi kas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, description, branchId } = body;

    if (!type || !amount || !description) {
      return NextResponse.json({ error: "Kolom wajib tidak lengkap" }, { status: 400 });
    }

    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Jumlah harus berupa angka positif" }, { status: 400 });
    }

    // Enforce branch context for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : (branchId || null);

    const newTransaction = {
      id: crypto.randomUUID(),
      type,
      category: "MUTASI_CASH",
      amount: amt,
      description,
      referenceId: null,
      branchId: finalBranchId,
      paymentMethod: "CASH",
      attachmentUrl: null,
      date: new Date().toISOString(),
    };

    await db.insert(financeTransactions).values(newTransaction);

    // Otomatisasi Jurnal
    let debitAccount = COA.KAS;
    let creditAccount = COA.KAS;

    if (type === "INCOME") {
      debitAccount = COA.KAS;
      creditAccount = COA.PENDAPATAN_LAIN;
    } else {
      debitAccount = COA.BEBAN_OPERASIONAL;
      creditAccount = COA.KAS;
    }

    await createJournalEntry({
      date: newTransaction.date,
      description: `[Mutasi Kas] ${description}`,
      referenceId: newTransaction.id,
      debitAccountId: debitAccount,
      creditAccountId: creditAccount,
      amount: amt,
    });

    return NextResponse.json({ success: true, data: newTransaction });
  } catch (error) {
    console.error("POST /api/finance/cash-mutations error:", error);
    return NextResponse.json({ error: "Gagal mencatat mutasi kas" }, { status: 500 });
  }
}
