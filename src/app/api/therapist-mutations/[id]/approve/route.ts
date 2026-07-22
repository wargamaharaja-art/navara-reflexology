import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistMutations, therapists, branches, systemLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// PUT /api/therapist-mutations/[id]/approve — Setujui mutasi
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can approve
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Super Admin yang bisa menyetujui mutasi" }, { status: 403 });
    }

    const { id } = await params;

    const mutation = await db.select().from(therapistMutations).where(eq(therapistMutations.id, id)).limit(1);
    if (mutation.length === 0) {
      return NextResponse.json({ error: "Surat mutasi tidak ditemukan" }, { status: 404 });
    }

    const m = mutation[0];

    if (m.status !== "DRAFT") {
      return NextResponse.json({ error: `Hanya surat mutasi berstatus DRAFT yang bisa disetujui. Status saat ini: ${m.status}` }, { status: 400 });
    }

    // Re-validate: therapist still active
    const therapist = await db.select().from(therapists).where(eq(therapists.id, m.therapistId)).limit(1);
    if (therapist.length === 0 || !therapist[0].isActive) {
      return NextResponse.json({ error: "Terapis sudah tidak aktif, tidak bisa menyetujui mutasi" }, { status: 400 });
    }

    // Re-validate: destination branch still active
    const destBranch = await db.select().from(branches).where(eq(branches.id, m.toBranchId)).limit(1);
    if (destBranch.length === 0 || !destBranch[0].isActive) {
      return NextResponse.json({ error: "Cabang tujuan sudah tidak aktif, tidak bisa menyetujui mutasi" }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db.update(therapistMutations).set({
      status: "APPROVED",
      approvedBy: session.id,
      approvedByName: session.name,
      approvedAt: now,
      updatedAt: now,
    }).where(eq(therapistMutations.id, id));

    // System log
    await db.insert(systemLogs).values({
      id: crypto.randomUUID(),
      userId: session.id,
      userName: session.name,
      action: "APPROVE_MUTATION",
      entityType: "therapist_mutation",
      entityId: id,
      details: JSON.stringify({
        mutationNumber: m.mutationNumber,
        therapistId: m.therapistId,
        therapistName: therapist[0].name,
        effectiveDate: m.effectiveDate,
      }),
    });

    return NextResponse.json({ success: true, message: "Surat mutasi berhasil disetujui" });
  } catch (error) {
    console.error("PUT /api/therapist-mutations/[id]/approve error:", error);
    return NextResponse.json({ error: "Gagal menyetujui surat mutasi" }, { status: 500 });
  }
}
