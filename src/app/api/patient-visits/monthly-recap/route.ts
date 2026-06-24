import { db } from "@/lib/db";
import { patientVisits, services } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";
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
        if (v.status === "completed") {
          recap.totalRevenue += v.servicePrice;
        }
      } else {
        recap.totalUnpaid++;
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
