import { db } from "@/lib/db";
import { attendance, therapists } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    const branchFilter = await getActiveBranchFilter();

    // 1. Get therapists based on branch filter
    const therapistConditions = [eq(therapists.isActive, true)];
    if (branchFilter) {
      therapistConditions.push(eq(therapists.branchId, branchFilter));
    }

    const allTherapists = await db
      .select()
      .from(therapists)
      .where(and(...therapistConditions));

    // 2. Get attendance logs for this date
    const attendanceConditions = [eq(attendance.date, dateParam)];
    if (branchFilter) {
      attendanceConditions.push(eq(attendance.branchId, branchFilter));
    }

    const attendanceLogs = await db
      .select()
      .from(attendance)
      .where(and(...attendanceConditions));

    // Map logs to therapists
    const logsMap = new Map(attendanceLogs.map((log) => [log.therapistId, log]));

    const result = allTherapists.map((t) => {
      const log = logsMap.get(t.id);
      return {
        therapistId: t.id,
        therapistName: t.name,
        branchId: t.branchId,
        attendanceId: log?.id || null,
        date: dateParam,
        clockIn: log?.clockIn || "",
        clockOut: log?.clockOut || "",
        status: log?.status || "PRESENT",
        notes: log?.notes || "",
        photoUrl: log?.photoUrl || null,
      };
    });

    return Response.json({ data: result });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return Response.json({ error: "Gagal mengambil data absensi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];

    for (const record of records) {
      const { therapistId, branchId, date, clockIn, clockOut, status, notes } = record;

      if (!therapistId || !branchId || !date || !status) {
        continue;
      }

      // Enforce branch context for branch admin
      if (session.role === "BRANCH_ADMIN" && branchId !== session.branchId) {
        continue;
      }

      // Check if entry already exists
      const existing = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.therapistId, therapistId),
            eq(attendance.date, date)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update
        await db
          .update(attendance)
          .set({
            clockIn: clockIn || null,
            clockOut: clockOut || null,
            status,
            notes: notes || null,
          })
          .where(eq(attendance.id, existing[0].id));
      } else {
        // Insert
        const id = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        await db.insert(attendance).values({
          id,
          therapistId,
          branchId,
          date,
          clockIn: clockIn || null,
          clockOut: clockOut || null,
          status,
          notes: notes || null,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return Response.json({ error: "Gagal mencatat absensi" }, { status: 500 });
  }
}
