import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions, inventoryItems, patientVisits } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    const branchFilter = await getActiveBranchFilter();

    // 1. Kas & Bank (All time)
    let allFinanceQuery = db
      .select({
        type: financeTransactions.type,
        totalAmount: sql<number>`SUM(${financeTransactions.amount})`
      })
      .from(financeTransactions);

    if (branchFilter) {
      allFinanceQuery = allFinanceQuery.where(eq(financeTransactions.branchId, branchFilter)) as any;
    }

    const allFinance = await allFinanceQuery.groupBy(financeTransactions.type);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of allFinance) {
      if (row.type === "INCOME") totalIncome = row.totalAmount;
      if (row.type === "EXPENSE") totalExpense = row.totalAmount;
    }

    const kasDanBank = totalIncome - totalExpense;

    // 2. Pendapatan & Pengeluaran Bulan Ini
    let monthFinanceQuery = db
      .select({
        type: financeTransactions.type,
        totalAmount: sql<number>`SUM(${financeTransactions.amount})`
      })
      .from(financeTransactions);

    const dateCondition = sql`to_char(${financeTransactions.date}::timestamp, 'YYYY-MM') = ${month}`;
    if (branchFilter) {
      monthFinanceQuery = monthFinanceQuery.where(and(dateCondition, eq(financeTransactions.branchId, branchFilter))) as any;
    } else {
      monthFinanceQuery = monthFinanceQuery.where(dateCondition) as any;
    }

    const monthFinance = await monthFinanceQuery.groupBy(financeTransactions.type);

    let monthIncome = 0;
    let monthExpense = 0;

    for (const row of monthFinance) {
      if (row.type === "INCOME") monthIncome = row.totalAmount;
      if (row.type === "EXPENSE") monthExpense = row.totalAmount;
    }

    const labaBersih = monthIncome - monthExpense;

    // 3. Persediaan (Total Stock Quantity - global since items are master list)
    const inventoryQuery = await db
      .select({
        totalStock: sql<number>`SUM(${inventoryItems.currentStock})`
      })
      .from(inventoryItems);
      
    const totalPersediaan = inventoryQuery[0]?.totalStock || 0;

    // 4. Pasien Hari Ini
    const todayStr = new Date().toISOString().split("T")[0];
    let dailyVisitsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(patientVisits)
      .where(sql`date(${patientVisits.visitDate}) = ${todayStr}`);

    if (branchFilter) {
      dailyVisitsQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(patientVisits)
        .where(and(sql`date(${patientVisits.visitDate}) = ${todayStr}`, eq(patientVisits.branchId, branchFilter)));
    }

    const dailyVisitsResult = await dailyVisitsQuery;
    const dailyVisits = dailyVisitsResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        kasDanBank: kasDanBank,
        pendapatan: monthIncome,
        labaBersih: labaBersih,
        persediaan: totalPersediaan,
        pasienHarian: dailyVisits,
      }
    });

  } catch (error) {
    console.error("Dashboard summary API error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ringkasan" },
      { status: 500 }
    );
  }
}
