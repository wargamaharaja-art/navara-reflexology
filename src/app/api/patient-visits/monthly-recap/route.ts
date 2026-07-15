import { db } from "@/lib/db";
import { patientVisits, services, financeTransactions } from "@/lib/db/schema";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    
    // Default to current month (YYYY-MM) in Asia/Jakarta
    const targetMonth = monthParam || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).substring(0, 7);

    const branchFilter = await getActiveBranchFilter();

    // Query visits in the target month (e.g., visitDate starts with 'YYYY-MM-')
    const visitConditions = [like(patientVisits.visitDate, `${targetMonth}-%`)];
    if (branchFilter) {
      visitConditions.push(eq(patientVisits.branchId, branchFilter));
    }

    const result = await db
      .select({
        visitId: patientVisits.id,
        visitDate: patientVisits.visitDate,
        status: patientVisits.status,
        paymentStatus: patientVisits.paymentStatus,
        servicePrice: services.price,
      })
      .from(patientVisits)
      .innerJoin(services, eq(patientVisits.serviceId, services.id))
      .where(and(...visitConditions))
      .orderBy(desc(patientVisits.visitDate));

    // Get actual revenue from Finance Transactions (Source of Truth)
    const financeConditions = [
      eq(financeTransactions.type, "INCOME"),
      like(financeTransactions.date, `${targetMonth}-%`)
    ];
    if (branchFilter) {
      financeConditions.push(eq(financeTransactions.branchId, branchFilter));
    }
    const financeResult = await db
      .select({
        date: sql<string>`substring(CAST(${financeTransactions.date} AS text) from 1 for 10)`,
        amount: sql<number>`SUM(${financeTransactions.amount})`
      })
      .from(financeTransactions)
      .where(and(...financeConditions))
      .groupBy(sql`substring(CAST(${financeTransactions.date} AS text) from 1 for 10)`);
      
    const revenueMap: Record<string, number> = {};
    financeResult.forEach(f => {
      if (f.date) revenueMap[f.date] = Number(f.amount);
    });

    // Aggregate by date
    const dailyRecaps: Record<string, { date: string; totalVisits: number; totalRevenue: number; totalPaid: number; totalUnpaid: number }> = {};

    result.forEach((v) => {
      const date = v.visitDate;
      if (!dailyRecaps[date]) {
        dailyRecaps[date] = {
          date,
          totalVisits: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalUnpaid: 0,
        };
      }

      const recap = dailyRecaps[date];
      recap.totalVisits++;
      
      if (v.paymentStatus === "PAID") {
        recap.totalPaid++;
      } else {
        recap.totalUnpaid++;
      }
    });

    // Inject real revenue into the daily recaps
    Object.keys(dailyRecaps).forEach(date => {
      dailyRecaps[date].totalRevenue = revenueMap[date] || 0;
    });

    // For days that have revenue but no visits, we should also include them
    Object.keys(revenueMap).forEach(date => {
      if (!dailyRecaps[date]) {
        dailyRecaps[date] = {
          date,
          totalVisits: 0,
          totalRevenue: revenueMap[date],
          totalPaid: 0,
          totalUnpaid: 0,
        };
      }
    });

    // Convert to sorted array (latest date first)
    const sortedData = Object.values(dailyRecaps).sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      success: true,
      targetMonth,
      data: sortedData,
    });
  } catch (error) {
    console.error("GET /api/patient-visits/monthly-recap error:", error);
    return NextResponse.json({ error: "Gagal memuat rekap bulanan" }, { status: 500 });
  }
}
