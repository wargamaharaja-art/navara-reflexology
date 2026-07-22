import { db } from "@/lib/db";
import { therapists, patientVisits } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET /api/cron/release-therapists
// Auto-release terapis yang checkOutTime sudah lewat
// Dipanggil oleh client-side interval setiap 60 detik
export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    const nowStr = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const nowJkt = new Date(nowStr);
    const currentTime = `${String(nowJkt.getHours()).padStart(2, "0")}:${String(nowJkt.getMinutes()).padStart(2, "0")}`;

    // Cari kunjungan yang:
    // - status masih in_progress
    // - belum punya actualCheckOutTime
    const activeVisits = await db
      .select({
        id: patientVisits.id,
        therapistId: patientVisits.therapistId,
        checkOutTime: patientVisits.checkOutTime,
        visitDate: patientVisits.visitDate,
      })
      .from(patientVisits)
      .where(
        and(
          eq(patientVisits.status, "in_progress"),
          isNull(patientVisits.actualCheckOutTime)
        )
      );

    let releasedCount = 0;
    const releasedTherapists: string[] = [];

    for (const visit of activeVisits) {
      if (!visit.therapistId) continue;

      // Kunjungan hari kemarin harus diselesaikan paksa
      const isPastDate = visit.visitDate < todayStr;
      // Bandingkan waktu: checkOutTime <= currentTime berarti sudah waktunya selesai
      const isTimePassed = visit.visitDate === todayStr && visit.checkOutTime && visit.checkOutTime <= currentTime;

      if (isPastDate || isTimePassed) {
        // Update kunjungan: set actualCheckOutTime & status completed
        await db
          .update(patientVisits)
          .set({
            actualCheckOutTime: isPastDate ? (visit.checkOutTime || "23:59") : currentTime,
            status: "completed",
            updatedAt: now.toISOString(),
          })
          .where(eq(patientVisits.id, visit.id));

        // Update terapis → AVAILABLE (hanya jika masih BUSY)
        await db
          .update(therapists)
          .set({ availabilityStatus: "AVAILABLE" })
          .where(
            and(
              eq(therapists.id, visit.therapistId),
              eq(therapists.availabilityStatus, "BUSY")
            )
          );

        releasedCount++;
        releasedTherapists.push(visit.therapistId);
      }
    }

    return Response.json({
      success: true,
      releasedCount,
      releasedTherapists,
      checkedAt: currentTime,
    });
  } catch (error) {
    console.error("GET /api/cron/release-therapists error:", error);
    return Response.json({ error: "Gagal auto-release terapis" }, { status: 500 });
  }
}
