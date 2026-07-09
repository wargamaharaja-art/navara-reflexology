import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions, inventoryItems, patientVisits, services, attendance, reservations } from "@/lib/db/schema";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
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

    // 2.5 Pendapatan & Pengeluaran Bulan Lalu
    const [year, mth] = month.split('-');
    let lmYear = parseInt(year);
    let lmMonth = parseInt(mth) - 1;
    if (lmMonth === 0) {
      lmMonth = 12;
      lmYear -= 1;
    }
    const lastMonthStr = `${lmYear}-${String(lmMonth).padStart(2, '0')}`;

    let lastMonthFinanceQuery = db
      .select({
        type: financeTransactions.type,
        totalAmount: sql<number>`SUM(${financeTransactions.amount})`
      })
      .from(financeTransactions);

    const lmDateCondition = sql`to_char(${financeTransactions.date}::timestamp, 'YYYY-MM') = ${lastMonthStr}`;
    if (branchFilter) {
      lastMonthFinanceQuery = lastMonthFinanceQuery.where(and(lmDateCondition, eq(financeTransactions.branchId, branchFilter))) as any;
    } else {
      lastMonthFinanceQuery = lastMonthFinanceQuery.where(lmDateCondition) as any;
    }

    const lastMonthFinance = await lastMonthFinanceQuery.groupBy(financeTransactions.type);
    let lastMonthIncome = 0;
    let lastMonthExpense = 0;

    for (const row of lastMonthFinance) {
      if (row.type === "INCOME") lastMonthIncome = row.totalAmount;
      if (row.type === "EXPENSE") lastMonthExpense = row.totalAmount;
    }
    const labaBersihBulanLalu = lastMonthIncome - lastMonthExpense;

    // 3. Persediaan (Total Stock Quantity - global since items are master list)
    const inventoryQuery = await db
      .select({
        totalStock: sql<number>`SUM(${inventoryItems.currentStock})`
      })
      .from(inventoryItems);
      
    const totalPersediaan = inventoryQuery[0]?.totalStock || 0;

    // 4. Pasien Hari Ini & Kemarin
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

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

    let yesterdayVisitsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(patientVisits)
      .where(sql`date(${patientVisits.visitDate}) = ${yesterdayStr}`);

    if (branchFilter) {
      yesterdayVisitsQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(patientVisits)
        .where(and(sql`date(${patientVisits.visitDate}) = ${yesterdayStr}`, eq(patientVisits.branchId, branchFilter)));
    }
    const yesterdayVisitsResult = await yesterdayVisitsQuery;
    const yesterdayVisits = yesterdayVisitsResult[0]?.count || 0;

    // 5. Pendapatan Hari Ini & Kemarin
    let dailyIncomeQuery = db
      .select({
        totalAmount: sql<number>`SUM(${financeTransactions.amount})`,
        totalCount: sql<number>`count(*)`
      })
      .from(financeTransactions)
      .where(and(
        sql`date(${financeTransactions.date}::timestamp) = ${todayStr}`,
        eq(financeTransactions.type, "INCOME")
      ));

    if (branchFilter) {
      dailyIncomeQuery = db
        .select({
          totalAmount: sql<number>`SUM(${financeTransactions.amount})`,
          totalCount: sql<number>`count(*)`
        })
        .from(financeTransactions)
        .where(and(
          sql`date(${financeTransactions.date}::timestamp) = ${todayStr}`,
          eq(financeTransactions.type, "INCOME"),
          eq(financeTransactions.branchId, branchFilter)
        ));
    }

    const dailyIncomeResult = await dailyIncomeQuery;
    const pendapatanHarian = dailyIncomeResult[0]?.totalAmount || 0;
    const transaksiHarian = dailyIncomeResult[0]?.totalCount || 0;

    let yesterdayIncomeQuery = db
      .select({ totalAmount: sql<number>`SUM(${financeTransactions.amount})` })
      .from(financeTransactions)
      .where(and(
        sql`date(${financeTransactions.date}::timestamp) = ${yesterdayStr}`,
        eq(financeTransactions.type, "INCOME")
      ));

    if (branchFilter) {
      yesterdayIncomeQuery = db
        .select({ totalAmount: sql<number>`SUM(${financeTransactions.amount})` })
        .from(financeTransactions)
        .where(and(
          sql`date(${financeTransactions.date}::timestamp) = ${yesterdayStr}`,
          eq(financeTransactions.type, "INCOME"),
          eq(financeTransactions.branchId, branchFilter)
        ));
    }
    const yesterdayIncomeResult = await yesterdayIncomeQuery;
    const pendapatanKemarin = yesterdayIncomeResult[0]?.totalAmount || 0;

    // 5.5 Terapis Bertugas Hari Ini (Berdasarkan Absensi)
    let dailyTherapistsQuery = db
      .select({ count: sql<number>`count(distinct ${attendance.therapistId})` })
      .from(attendance)
      .where(and(
        eq(attendance.date, todayStr),
        inArray(attendance.status, ["PRESENT", "LATE"])
      ));

    if (branchFilter) {
      dailyTherapistsQuery = db
        .select({ count: sql<number>`count(distinct ${attendance.therapistId})` })
        .from(attendance)
        .where(and(
          eq(attendance.date, todayStr),
          inArray(attendance.status, ["PRESENT", "LATE"]),
          eq(attendance.branchId, branchFilter)
        ));
    }

    const dailyTherapistsResult = await dailyTherapistsQuery;
    const terapisHarian = dailyTherapistsResult[0]?.count || 0;

    // 6. Top Layanan Bulan Ini
    let topServicesQuery = db
      .select({
        serviceId: patientVisits.serviceId,
        count: sql<number>`count(*)`
      })
      .from(patientVisits)
      .where(sql`to_char(${patientVisits.visitDate}::timestamp, 'YYYY-MM') = ${month}`);

    if (branchFilter) {
      topServicesQuery = db
        .select({
          serviceId: patientVisits.serviceId,
          count: sql<number>`count(*)`
        })
        .from(patientVisits)
        .where(and(
          sql`to_char(${patientVisits.visitDate}::timestamp, 'YYYY-MM') = ${month}`,
          eq(patientVisits.branchId, branchFilter)
        ));
    }

    const topServicesStats = await topServicesQuery.groupBy(patientVisits.serviceId).orderBy(desc(sql`count(*)`)).limit(4);

    let topServicesToday: { name: string; count: number; percentage: number }[] = [];
    
    if (topServicesStats.length > 0) {
      const serviceIds = topServicesStats.map(s => s.serviceId);
      const servicesData = await db
        .select({ id: services.id, name: services.name })
        .from(services)
        .where(inArray(services.id, serviceIds));
        
      const totalTopServices = topServicesStats.reduce((sum, s) => sum + Number(s.count), 0);
      
      topServicesToday = topServicesStats.map(stat => {
        const serviceName = servicesData.find(s => s.id === stat.serviceId)?.name || 'Unknown';
        return {
          name: serviceName,
          count: Number(stat.count),
          percentage: totalTopServices > 0 ? Math.round((Number(stat.count) / totalTopServices) * 100) : 0
        };
      });
    }

    // Default fallback if no data today, get all time popular (for mockup visual if DB is empty today)
    if (topServicesToday.length === 0) {
       let fallbackQuery = db
         .select({
           serviceId: patientVisits.serviceId,
           count: sql<number>`count(*)`
         })
         .from(patientVisits);
         
       if (branchFilter) {
         fallbackQuery = fallbackQuery.where(eq(patientVisits.branchId, branchFilter)) as any;
       }
       
       const fallbackStats = await fallbackQuery.groupBy(patientVisits.serviceId).orderBy(desc(sql`count(*)`)).limit(4);
       if (fallbackStats.length > 0) {
         const fallbackIds = fallbackStats.map(s => s.serviceId);
         const fallbackData = await db.select({ id: services.id, name: services.name }).from(services).where(inArray(services.id, fallbackIds));
         const fallbackTotal = fallbackStats.reduce((sum, s) => sum + Number(s.count), 0);
         topServicesToday = fallbackStats.map(stat => ({
           name: fallbackData.find(s => s.id === stat.serviceId)?.name || 'Unknown',
           count: Number(stat.count),
           percentage: fallbackTotal > 0 ? Math.round((Number(stat.count) / fallbackTotal) * 100) : 0
         }));
       } else {
         // Absolute fallback if no data at all
         topServicesToday = [
           { name: "Bekam", count: 42, percentage: 42 },
           { name: "Refleksi", count: 28, percentage: 28 },
           { name: "Massage", count: 18, percentage: 18 },
           { name: "Facial", count: 12, percentage: 12 },
         ];
       }
    }

    // 7. Reservasi Baru (PENDING)
    let pendingReservationsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(eq(reservations.status, "PENDING"));

    if (branchFilter) {
      pendingReservationsQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(and(
          eq(reservations.status, "PENDING"),
          eq(reservations.branchId, branchFilter)
        ));
    }

    const pendingReservationsResult = await pendingReservationsQuery;
    const reservationsBaru = pendingReservationsResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        kasDanBank: kasDanBank,
        pendapatan: monthIncome,
        pendapatanBulanLalu: lastMonthIncome,
        labaBersih: labaBersih,
        labaBersihBulanLalu: labaBersihBulanLalu,
        pengeluaran: monthExpense,
        pengeluaranBulanLalu: lastMonthExpense,
        persediaan: totalPersediaan,
        pasienHarian: dailyVisits,
        pasienKemarin: yesterdayVisits,
        pendapatanHarian: pendapatanHarian,
        transaksiHarian: transaksiHarian,
        pendapatanKemarin: pendapatanKemarin,
        reservationsBaru: reservationsBaru,
        terapisHarian: terapisHarian,
        topServicesToday: topServicesToday,
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
