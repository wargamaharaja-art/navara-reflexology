import { db } from "@/lib/db";
import { patients, patientVisits } from "@/lib/db/schema";
import { eq, sql, max, desc, and } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = (page - 1) * limit;

    const branchFilter = await getActiveBranchFilter();

    // 1. Subquery to get latest visit per patient
    const visitConditions = [];
    if (branchFilter) {
      visitConditions.push(eq(patientVisits.branchId, branchFilter));
    }
    
    const latestVisits = db.select({
      patientId: patientVisits.patientId,
      lastVisitDate: max(patientVisits.visitDate).as("last_visit_date"),
    })
    .from(patientVisits)
    .where(visitConditions.length > 0 ? and(...visitConditions) : undefined)
    .groupBy(patientVisits.patientId)
    .as("latest_visits");

    // The condition for retention is: > 14 days since last visit based on database calendar date
    const daysSinceCondition = sql`CURRENT_DATE - (${latestVisits.lastVisitDate})::date > 14`;

    if (countOnly) {
      // Just return the count for the badge
      const countResult = await db.select({
        total: sql<number>`count(*)::int`
      })
      .from(patients)
      .innerJoin(latestVisits, eq(patients.id, latestVisits.patientId))
      .where(daysSinceCondition);

      return Response.json({ total: countResult[0]?.total || 0 });
    }

    // Return paginated data
    // Fetch total count for pagination info
    const countResult = await db.select({
      total: sql<number>`count(*)::int`
    })
    .from(patients)
    .innerJoin(latestVisits, eq(patients.id, latestVisits.patientId))
    .where(daysSinceCondition);
    
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Fetch the actual paginated data
    const result = await db.select({
      patient: patients,
      lastVisitDate: latestVisits.lastVisitDate,
      daysSinceLastVisit: sql<number>`CURRENT_DATE - (${latestVisits.lastVisitDate})::date`.as("days_since")
    })
    .from(patients)
    .innerJoin(latestVisits, eq(patients.id, latestVisits.patientId))
    .where(daysSinceCondition)
    .orderBy(desc(sql`days_since`))
    .limit(limit)
    .offset(offset);

    const mappedData = result.map(row => ({
      patient: row.patient,
      lastVisitDate: row.lastVisitDate, 
      daysSinceLastVisit: row.daysSinceLastVisit
    }));

    return Response.json({ 
      data: mappedData,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error("GET /api/patients/retention error:", error);
    return Response.json({ error: "Gagal mengambil data retensi pasien" }, { status: 500 });
  }
}
