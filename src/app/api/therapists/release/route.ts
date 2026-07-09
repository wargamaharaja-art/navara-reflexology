import { db } from "@/lib/db";
import { therapists, patientVisits } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// POST /api/therapists/release
// Rilis terapis (set AVAILABLE) — manual oleh admin saat kunjungan selesai
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { therapistId, visitId } = body;

    if (!therapistId) {
      return Response.json({ error: "therapistId wajib diisi" }, { status: 400 });
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Update status terapis → AVAILABLE
    await db
      .update(therapists)
      .set({ availabilityStatus: "AVAILABLE" })
      .where(eq(therapists.id, therapistId));

    // Jika visitId diberikan, update actualCheckOutTime dan status kunjungan
    if (visitId) {
      await db
        .update(patientVisits)
        .set({
          actualCheckOutTime: currentTime,
          status: "completed",
          updatedAt: now.toISOString(),
        })
        .where(eq(patientVisits.id, visitId));
    }

    return Response.json({ success: true, releasedAt: currentTime });
  } catch (error) {
    console.error("POST /api/therapists/release error:", error);
    return Response.json({ error: "Gagal merilis terapis" }, { status: 500 });
  }
}
