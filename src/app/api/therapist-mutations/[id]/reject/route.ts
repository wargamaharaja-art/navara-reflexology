import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistMutations, therapists, systemLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// PUT /api/therapist-mutations/[id]/reject — Tolak mutasi
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can reject
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Super Admin yang bisa menolak mutasi" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rejectedReason } = body;

    if (!rejectedReason || rejectedReason.trim().length < 10) {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi (minimal 10 karakter)" }, { status: 400 });
    }

    const mutation = await db.select().from(therapistMutations).where(eq(therapistMutations.id, id)).limit(1);
    if (mutation.length === 0) {
      return NextResponse.json({ error: "Surat mutasi tidak ditemukan" }, { status: 404 });
    }

    const m = mutation[0];

    if (m.status !== "DRAFT") {
      return NextResponse.json({ error: `Hanya surat mutasi berstatus DRAFT yang bisa ditolak. Status saat ini: ${m.status}` }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db.update(therapistMutations).set({
      status: "REJECTED",
      rejectedReason: rejectedReason.trim(),
      updatedAt: now,
    }).where(eq(therapistMutations.id, id));

    // Fetch therapist name for log
    const therapist = await db.select({ name: therapists.name }).from(therapists).where(eq(therapists.id, m.therapistId)).limit(1);

    // System log
    await db.insert(systemLogs).values({
      id: crypto.randomUUID(),
      userId: session.id,
      userName: session.name,
      action: "REJECT_MUTATION",
      entityType: "therapist_mutation",
      entityId: id,
      details: JSON.stringify({
        mutationNumber: m.mutationNumber,
        therapistName: therapist[0]?.name || "—",
        rejectedReason: rejectedReason.trim(),
      }),
    });

    return NextResponse.json({ success: true, message: "Surat mutasi berhasil ditolak" });
  } catch (error) {
    console.error("PUT /api/therapist-mutations/[id]/reject error:", error);
    return NextResponse.json({ error: "Gagal menolak surat mutasi" }, { status: 500 });
  }
}
