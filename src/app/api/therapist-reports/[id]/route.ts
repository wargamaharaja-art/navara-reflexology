import { db } from "@/lib/db";
import { therapistMonthlyReports, therapists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db
      .select({
        id: therapistMonthlyReports.id,
        month: therapistMonthlyReports.month,
        therapistName: therapists.name,
      })
      .from(therapistMonthlyReports)
      .innerJoin(therapists, eq(therapistMonthlyReports.therapistId, therapists.id))
      .where(eq(therapistMonthlyReports.id, id))
      .limit(1);

    if (report.length === 0) {
      return Response.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    return Response.json(report[0]);
  } catch (error) {
    console.error("GET /api/therapist-reports/[id] error:", error);
    return Response.json({ error: "Gagal mengambil data laporan" }, { status: 500 });
  }
}
