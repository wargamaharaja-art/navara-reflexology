import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistMutations, therapists, systemLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// PUT /api/therapist-mutations/[id]/cancel — Batalkan mutasi
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perms = session.permissions || [];
    if (!perms.includes("PEGAWAI_MUTASI") && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const mutation = await db.select().from(therapistMutations).where(eq(therapistMutations.id, id)).limit(1);
    if (mutation.length === 0) {
      return NextResponse.json({ error: "Surat mutasi tidak ditemukan" }, { status: 404 });
    }

    const m = mutation[0];

    if (m.status !== "DRAFT") {
      return NextResponse.json({ error: `Hanya surat mutasi berstatus DRAFT yang bisa dibatalkan. Status saat ini: ${m.status}` }, { status: 400 });
    }

    // BRANCH_ADMIN can only cancel their own requests
    if (session.role === "BRANCH_ADMIN" && m.requestedBy !== session.id) {
      return NextResponse.json({ error: "Anda hanya bisa membatalkan surat mutasi yang Anda buat sendiri" }, { status: 403 });
    }

    const now = new Date().toISOString();

    await db.update(therapistMutations).set({
      status: "CANCELLED",
      updatedAt: now,
    }).where(eq(therapistMutations.id, id));

    // Fetch therapist name for log
    const therapist = await db.select({ name: therapists.name }).from(therapists).where(eq(therapists.id, m.therapistId)).limit(1);

    // System log
    await db.insert(systemLogs).values({
      id: crypto.randomUUID(),
      userId: session.id,
      userName: session.name,
      action: "CANCEL_MUTATION",
      entityType: "therapist_mutation",
      entityId: id,
      details: JSON.stringify({
        mutationNumber: m.mutationNumber,
        therapistName: therapist[0]?.name || "—",
      }),
    });

    return NextResponse.json({ success: true, message: "Surat mutasi berhasil dibatalkan" });
  } catch (error) {
    console.error("PUT /api/therapist-mutations/[id]/cancel error:", error);
    return NextResponse.json({ error: "Gagal membatalkan surat mutasi" }, { status: 500 });
  }
}
