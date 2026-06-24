import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions } from "@/lib/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { createJournalEntry, COA } from "@/lib/accounting";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchFilter = await getActiveBranchFilter();
    
    // Use the active branch filter, or fallback to query param if super admin
    const branch = branchFilter || searchParams.get("branch");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (branch) {
      conditions.push(eq(financeTransactions.branchId, branch));
    }
    if (startDate) {
      const startObj = new Date(startDate);
      startObj.setHours(0, 0, 0, 0);
      conditions.push(gte(financeTransactions.date, startObj.toISOString()));
    }
    if (endDate) {
      const endObj = new Date(endDate);
      endObj.setHours(23, 59, 59, 999);
      conditions.push(lte(financeTransactions.date, endObj.toISOString()));
    }

    const allTransactions = await db
      .select()
      .from(financeTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(financeTransactions.date));
    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error("Failed to fetch finance transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, category, amount, description, referenceId, branchId, paymentMethod, attachmentUrl } = body;

    if (!type || !category || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "INCOME") {
      return NextResponse.json({ error: "Pemasukan hanya dapat dicatat melalui sistem pembayaran pasien." }, { status: 403 });
    }

    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    // Enforce branch context
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : (branchId || null);

    const newTransaction = {
      id: crypto.randomUUID(),
      type,
      category,
      amount: amt,
      description,
      referenceId: referenceId || null,
      branchId: finalBranchId,
      paymentMethod: paymentMethod || "CASH",
      attachmentUrl: attachmentUrl || null,
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
      creditAccount = COA.KAS;
      const catLower = category.toLowerCase();
      if (catLower.includes("stok") || catLower.includes("obat") || catLower.includes("alat")) {
        debitAccount = COA.HPP_BARANG;
      } else if (catLower.includes("gaji") || catLower.includes("komisi")) {
        debitAccount = COA.BEBAN_GAJI;
      } else {
        debitAccount = COA.BEBAN_OPERASIONAL;
      }
    }

    await createJournalEntry({
      date: newTransaction.date,
      description: `[Manual] ${category}: ${description}`,
      referenceId: newTransaction.id,
      debitAccountId: debitAccount,
      creditAccountId: creditAccount,
      amount: amt
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Failed to create finance transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
