import { db } from "@/lib/db";
import { therapists, therapistMonthlyReports, patientVisits, attendance, therapistCommissions } from "@/lib/db/schema";
import { eq, and, like, gte, lte } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD

    let filterMonth = month;
    let filterStartDate = startDate;
    let filterEndDate = endDate;

    if (!filterStartDate || !filterEndDate) {
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return Response.json({ error: "Periode bulan (YYYY-MM) atau rentang tanggal wajib diisi" }, { status: 400 });
      }
      // Derive start and end date from month
      const [year, m] = month.split("-");
      filterStartDate = `${year}-${m}-01`;
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
      filterEndDate = `${year}-${m}-${lastDay}`;
    }

    const branchFilter = await getActiveBranchFilter();

    // 1. Fetch therapists in the active branch
    const therapistConditions = [eq(therapists.isActive, true)];
    if (branchFilter) {
      therapistConditions.push(eq(therapists.branchId, branchFilter));
    }

    const activeTherapists = await db
      .select()
      .from(therapists)
      .where(and(...therapistConditions));

    // 2. Fetch existing saved reports for this period
    // If using month, match month. If custom, maybe match startDate and endDate.
    const reportConditions = [];
    if (month) {
      reportConditions.push(eq(therapistMonthlyReports.month, month));
    } else {
      reportConditions.push(
        and(
          eq(therapistMonthlyReports.startDate, filterStartDate as string),
          eq(therapistMonthlyReports.endDate, filterEndDate as string)
        )
      );
    }
    
    const savedReports = await db
      .select()
      .from(therapistMonthlyReports)
      .where(and(...reportConditions));

    const savedReportsMap = new Map(savedReports.map(r => [r.therapistId, r]));

    // 3. Pre-fetch semua komisi dan kunjungan bulan ini sekali saja (efisien)
    const allMonthCommissions = await db
      .select({
        therapistId: therapistCommissions.therapistId,
        amount: therapistCommissions.amount,
      })
      .from(therapistCommissions)
      .innerJoin(patientVisits, eq(therapistCommissions.visitId, patientVisits.id))
      .where(
        and(
          gte(patientVisits.visitDate, filterStartDate as string),
          lte(patientVisits.visitDate, filterEndDate as string)
        )
      );

    const allMonthVisits = await db
      .select({ therapistId: patientVisits.therapistId })
      .from(patientVisits)
      .where(
        and(
          eq(patientVisits.status, "completed"),
          gte(patientVisits.visitDate, filterStartDate as string),
          lte(patientVisits.visitDate, filterEndDate as string)
        )
      );

    // 4. For each therapist, map existing report or calculate defaults
    const data = await Promise.all(
      activeTherapists.map(async (t) => {
        // Selalu hitung komisi & treatment aktual dari DB (tidak boleh stale)
        const actualCommissions = allMonthCommissions
          .filter(c => c.therapistId === t.id)
          .reduce((sum, c) => sum + c.amount, 0);
        const actualTreatments = allMonthVisits.filter(v => v.therapistId === t.id).length;

        const saved = savedReportsMap.get(t.id);
        if (saved) {
          // Laporan tersimpan: override commissions & totalTreatments dengan data aktual
          const newTakeHomePay = saved.baseSalary + actualCommissions + saved.allowances + saved.bonuses - saved.deductions;
          return {
            ...saved,
            therapistName: t.name,
            branchId: t.branchId,
            commissions: actualCommissions,          // ← selalu real-time
            totalTreatments: actualTreatments,       // ← selalu real-time
            takeHomePay: newTakeHomePay,             // ← dihitung ulang
            isSaved: true,
          };
        }

        // Auto-calculate for unsaved reports
        // A. Attendance counts
        const attendanceLogs = await db
          .select({ status: attendance.status })
          .from(attendance)
          .where(
            and(
              eq(attendance.therapistId, t.id),
              gte(attendance.date, filterStartDate as string),
              lte(attendance.date, filterEndDate as string)
            )
          );

        let present = 0;
        let late = 0;
        let absent = 0;
        attendanceLogs.forEach((log) => {
          if (log.status === "PRESENT") present++;
          else if (log.status === "LATE") late++;
          else if (log.status === "ABSENT") absent++;
        });

        const takeHomePay = t.baseSalary + actualCommissions;

        return {
          id: null,
          therapistId: t.id,
          therapistName: t.name,
          branchId: t.branchId,
          month,
          startDate: filterStartDate,
          endDate: filterEndDate,
          totalTreatments: actualTreatments,
          attendancePresent: present,
          attendanceLate: late,
          attendanceAbsent: absent,
          attendancePermit: 0,
          baseSalary: t.baseSalary,
          commissions: actualCommissions,
          allowances: 0,
          bonuses: 0,
          deductions: 0,
          takeHomePay,
          notesStrengths: "",
          notesImprovements: "",
          notesTargets: "",
          rating: "5.0",
          isSaved: false,
        };
      })
    );


    return Response.json({ data });
  } catch (error) {
    console.error("GET /api/therapist-reports error:", error);
    return Response.json({ error: "Gagal mengambil data laporan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      therapistId,
      month,
      startDate,
      endDate,
      totalTreatments,
      attendancePresent,
      attendanceLate,
      attendanceAbsent,
      attendancePermit,
      baseSalary,
      commissions,
      allowances,
      bonuses,
      deductions,
      takeHomePay,
      notesStrengths,
      notesImprovements,
      notesTargets,
      rating,
    } = body;

    if (!therapistId || (!month && (!startDate || !endDate))) {
      return Response.json({ error: "Data terapis dan bulan/rentang tanggal wajib diisi" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (id) {
      // Update existing report
      await db
        .update(therapistMonthlyReports)
        .set({
          startDate: startDate || null,
          endDate: endDate || null,
          totalTreatments: parseInt(totalTreatments) || 0,
          attendancePresent: parseInt(attendancePresent) || 0,
          attendanceLate: parseInt(attendanceLate) || 0,
          attendanceAbsent: parseInt(attendanceAbsent) || 0,
          attendancePermit: parseInt(attendancePermit) || 0,
          baseSalary: parseInt(baseSalary) || 0,
          commissions: parseInt(commissions) || 0,
          allowances: parseInt(allowances) || 0,
          bonuses: parseInt(bonuses) || 0,
          deductions: parseInt(deductions) || 0,
          takeHomePay: parseInt(takeHomePay) || 0,
          notesStrengths: notesStrengths || "",
          notesImprovements: notesImprovements || "",
          notesTargets: notesTargets || "",
          rating: rating || "5.0",
          updatedAt: now,
        })
        .where(eq(therapistMonthlyReports.id, id));

      return Response.json({ success: true, id });
    } else {
      const baseCondition = eq(therapistMonthlyReports.therapistId, therapistId);
      const periodCondition = month 
        ? eq(therapistMonthlyReports.month, month)
        : and(
            eq(therapistMonthlyReports.startDate, startDate),
            eq(therapistMonthlyReports.endDate, endDate)
          );

      const existing = await db
        .select()
        .from(therapistMonthlyReports)
        .where(and(baseCondition, periodCondition))
        .limit(1);

      if (existing.length > 0) {
        return Response.json({ error: "Laporan untuk terapis ini pada periode ini sudah dibuat" }, { status: 400 });
      }

      const newId = crypto.randomUUID();
      await db.insert(therapistMonthlyReports).values({
        id: newId,
        therapistId,
        month: month || null,
        startDate: startDate || null,
        endDate: endDate || null,
        totalTreatments: parseInt(totalTreatments) || 0,
        attendancePresent: parseInt(attendancePresent) || 0,
        attendanceLate: parseInt(attendanceLate) || 0,
        attendanceAbsent: parseInt(attendanceAbsent) || 0,
        attendancePermit: parseInt(attendancePermit) || 0,
        baseSalary: parseInt(baseSalary) || 0,
        commissions: parseInt(commissions) || 0,
        allowances: parseInt(allowances) || 0,
        bonuses: parseInt(bonuses) || 0,
        deductions: parseInt(deductions) || 0,
        takeHomePay: parseInt(takeHomePay) || 0,
        notesStrengths: notesStrengths || "",
        notesImprovements: notesImprovements || "",
        notesTargets: notesTargets || "",
        rating: rating || "5.0",
        createdAt: now,
        updatedAt: now,
      });

      return Response.json({ success: true, id: newId });
    }
  } catch (error) {
    console.error("POST /api/therapist-reports error:", error);
    return Response.json({ error: "Gagal menyimpan laporan" }, { status: 500 });
  }
}
