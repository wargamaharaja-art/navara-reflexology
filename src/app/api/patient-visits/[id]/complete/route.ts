import { db } from "@/lib/db";
import { patientVisits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: visitId } = await params;

    await db.update(patientVisits)
      .set({ status: "completed", updatedAt: new Date().toISOString() })
      .where(eq(patientVisits.id, visitId));

    return Response.json({ success: true, message: "Kunjungan berhasil diselesaikan" });
  } catch (error) {
    console.error("PATCH /api/patient-visits/[id]/complete error:", error);
    return Response.json({ error: "Gagal menyelesaikan kunjungan" }, { status: 500 });
  }
}
