import { db } from "@/lib/db";
import { therapists, patientVisits, attendance, services } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

// GET /api/therapists/availability?branchId=xxx
// Endpoint ringan untuk polling status terapis secara periodik
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const branchFilter = branchId || (await getActiveBranchFilter());

    const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Ambil terapis aktif di cabang ini
    const conditions: any[] = [eq(therapists.isActive, true)];
    if (branchFilter) {
      conditions.push(eq(therapists.branchId, branchFilter));
    }

    const allTherapists = await db
      .select({
        id: therapists.id,
        name: therapists.name,
        specialization: therapists.specialization,
        gender: therapists.gender,
        photoUrl: therapists.photoUrl,
        branchId: therapists.branchId,
        availabilityStatus: therapists.availabilityStatus,
      })
      .from(therapists)
      .where(and(...conditions));

    // Ambil kunjungan hari ini untuk setiap terapis
    const todayVisits = await db
      .select({
        id: patientVisits.id,
        therapistId: patientVisits.therapistId,
        checkInTime: patientVisits.checkInTime,
        checkOutTime: patientVisits.checkOutTime,
        actualCheckOutTime: patientVisits.actualCheckOutTime,
        status: patientVisits.status,
        serviceId: patientVisits.serviceId,
      })
      .from(patientVisits)
      .where(
        and(
          eq(patientVisits.visitDate, todayStr),
        )
      );

    // Ambil data absensi hari ini
    const todayAttendance = await db
      .select({
        therapistId: attendance.therapistId,
        status: attendance.status,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
      })
      .from(attendance)
      .where(eq(attendance.date, todayStr));

    // Ambil data layanan untuk durasi
    const allServices = await db.select({ id: services.id, durationMinutes: services.durationMinutes, name: services.name }).from(services);

    const enriched = allTherapists.map((t) => {
      // Cek absensi hari ini
      const att = todayAttendance.find((a) => a.therapistId === t.id);
      const hasAttended = att && (att.status === "PRESENT" || att.status === "LATE");

      // Kunjungan terapis hari ini
      const therapistVisits = todayVisits.filter((v) => v.therapistId === t.id);
      const completedToday = therapistVisits.filter(
        (v) => v.status === "completed" || v.actualCheckOutTime
      ).length;

      // Cari kunjungan aktif (in_progress, belum ada actualCheckOutTime)
      const activeVisit = therapistVisits.find(
        (v) => v.status === "in_progress" && !v.actualCheckOutTime && v.checkInTime
      );

      // Tentukan status efektif
      let effectiveStatus = t.availabilityStatus;
      if (!hasAttended) {
        effectiveStatus = "OFF";
      } else if (activeVisit) {
        effectiveStatus = "BUSY";
      } else if (effectiveStatus === "BUSY" && !activeVisit) {
        // Jika DB bilang BUSY tapi tidak ada kunjungan aktif, berarti sudah selesai
        effectiveStatus = "AVAILABLE";
      }

      // Estimasi selesai
      let estimatedFinish: string | null = null;
      if (activeVisit?.checkOutTime) {
        estimatedFinish = activeVisit.checkOutTime;
      }

      // Info layanan aktif
      let currentServiceName: string | null = null;
      if (activeVisit) {
        const svc = allServices.find((s) => s.id === activeVisit.serviceId);
        currentServiceName = svc?.name || null;
      }

      return {
        id: t.id,
        name: t.name,
        specialization: t.specialization,
        gender: t.gender,
        photoUrl: t.photoUrl,
        branchId: t.branchId,
        availabilityStatus: effectiveStatus,
        patientsToday: completedToday + (activeVisit ? 1 : 0),
        estimatedFinish,
        currentServiceName,
        clockIn: att?.clockIn || null,
        clockOut: att?.clockOut || null,
      };
    });

    return Response.json({ data: enriched, serverTime: currentTime });
  } catch (error) {
    console.error("GET /api/therapists/availability error:", error);
    return Response.json({ error: "Gagal mengambil status terapis" }, { status: 500 });
  }
}

// PATCH /api/therapists/availability
// Toggle manual status terapis (BREAK/AVAILABLE)
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { therapistId, status } = body;

    if (!therapistId || !status) {
      return Response.json({ error: "therapistId dan status wajib diisi" }, { status: 400 });
    }

    if (!["AVAILABLE", "BREAK", "OFF"].includes(status)) {
      return Response.json({ error: "Status tidak valid. Gunakan AVAILABLE, BREAK, atau OFF." }, { status: 400 });
    }

    await db
      .update(therapists)
      .set({ availabilityStatus: status })
      .where(eq(therapists.id, therapistId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/therapists/availability error:", error);
    return Response.json({ error: "Gagal mengubah status terapis" }, { status: 500 });
  }
}
