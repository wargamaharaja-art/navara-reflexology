import { db } from "@/lib/db";
import { therapistMonthlyReports, therapists, branches, therapistCommissions, patientVisits } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return Response.json({ error: "PIN keamanan wajib diisi" }, { status: 400 });
    }

    // Fetch report joined with therapist and branch info
    const reportData = await db
      .select({
        reportId: therapistMonthlyReports.id,
        therapistId: therapistMonthlyReports.therapistId,
        month: therapistMonthlyReports.month,
        totalTreatments: therapistMonthlyReports.totalTreatments,
        attendancePresent: therapistMonthlyReports.attendancePresent,
        attendanceLate: therapistMonthlyReports.attendanceLate,
        attendanceAbsent: therapistMonthlyReports.attendanceAbsent,
        attendancePermit: therapistMonthlyReports.attendancePermit,
        baseSalary: therapistMonthlyReports.baseSalary,
        commissions: therapistMonthlyReports.commissions,
        allowances: therapistMonthlyReports.allowances,
        bonuses: therapistMonthlyReports.bonuses,
        deductions: therapistMonthlyReports.deductions,
        takeHomePay: therapistMonthlyReports.takeHomePay,
        notesStrengths: therapistMonthlyReports.notesStrengths,
        notesImprovements: therapistMonthlyReports.notesImprovements,
        notesTargets: therapistMonthlyReports.notesTargets,
        rating: therapistMonthlyReports.rating,
        
        therapistName: therapists.name,
        specialization: therapists.specialization,
        pinCode: therapists.pinCode,
        birthDate: therapists.birthDate,
        branchName: branches.name,
      })
      .from(therapistMonthlyReports)
      .innerJoin(therapists, eq(therapistMonthlyReports.therapistId, therapists.id))
      .leftJoin(branches, eq(therapists.branchId, branches.id))
      .where(eq(therapistMonthlyReports.id, id))
      .limit(1);

    if (reportData.length === 0) {
      return Response.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const report = reportData[0];

    // PIN Verification Logic
    let isValid = false;
    
    if (report.pinCode && pin === report.pinCode) {
      isValid = true;
    } else if (report.birthDate) {
      // birthDate is expected in YYYY-MM-DD
      const parts = report.birthDate.split("-");
      if (parts.length === 3) {
        const yyyy = parts[0];
        const mm = parts[1];
        const dd = parts[2];
        const defaultPin = `${dd}${mm}${yyyy.substring(2)}`; // DDMMYY format
        if (pin === defaultPin) {
          isValid = true;
        }
      }
    }

    if (!isValid) {
      return Response.json({ error: "PIN keamanan salah. Silakan coba lagi atau hubungi HR." }, { status: 401 });
    }

    // Hitung ulang komisi & treatment aktual dari DB (real-time, bukan stale)
    const commissionLogs = await db
      .select({ amount: therapistCommissions.amount })
      .from(therapistCommissions)
      .innerJoin(patientVisits, eq(therapistCommissions.visitId, patientVisits.id))
      .where(
        and(
          eq(therapistCommissions.therapistId, report.therapistId),
          like(patientVisits.visitDate, `${report.month}%`)
        )
      );
    const actualCommissions = commissionLogs.reduce((sum, c) => sum + c.amount, 0);

    const treatmentLogs = await db
      .select({ id: patientVisits.id })
      .from(patientVisits)
      .where(
        and(
          eq(patientVisits.therapistId, report.therapistId),
          eq(patientVisits.status, "completed"),
          like(patientVisits.visitDate, `${report.month}%`)
        )
      );
    const actualTreatments = treatmentLogs.length;

    const actualTakeHomePay = report.baseSalary + actualCommissions + report.allowances + report.bonuses - report.deductions;

    // Strip sensitive fields before sending response
    const { pinCode, birthDate, ...safePayload } = report;

    return Response.json({
      success: true,
      data: {
        ...safePayload,
        commissions: actualCommissions,
        totalTreatments: actualTreatments,
        takeHomePay: actualTakeHomePay,
      },
    });
  } catch (error) {
    console.error("POST /api/therapist-reports/[id]/verify error:", error);
    return Response.json({ error: "Gagal memverifikasi PIN" }, { status: 500 });
  }
}
