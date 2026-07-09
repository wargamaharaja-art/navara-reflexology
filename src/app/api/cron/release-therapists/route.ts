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
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Cari kunjungan hari ini yang:
    // - status masih in_progress
    // - punya checkOutTime
    // - belum punya actualCheckOutTime
    // - checkOutTime sudah lewat
    const activeVisits = await db
      .select({
        id: patientVisits.id,
        therapistId: patientVisits.therapistId,
        checkOutTime: patientVisits.checkOutTime,
      })
      .from(patientVisits)
      .where(
        and(
          eq(patientVisits.visitDate, todayStr),
          eq(patientVisits.status, "in_progress"),
          isNull(patientVisits.actualCheckOutTime)
        )
      );

    let releasedCount = 0;
    const releasedTherapists: string[] = [];

    for (const visit of activeVisits) {
      if (!visit.checkOutTime || !visit.therapistId) continue;

      // Bandingkan waktu: checkOutTime <= currentTime berarti sudah waktunya selesai
      if (visit.checkOutTime <= currentTime) {
        // Update kunjungan: set actualCheckOutTime & status completed
        await db
          .update(patientVisits)
          .set({
            actualCheckOutTime: currentTime,
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
