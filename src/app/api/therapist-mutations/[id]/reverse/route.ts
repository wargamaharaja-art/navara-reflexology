import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistMutations, therapists, systemLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// PUT /api/therapist-mutations/[id]/reverse — Rollback mutasi yang sudah EXECUTED
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can reverse
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Super Admin yang bisa membatalkan mutasi yang sudah berlaku" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reversedReason } = body;

    if (!reversedReason || reversedReason.trim().length < 10) {
      return NextResponse.json({ error: "Alasan pembatalan wajib diisi (minimal 10 karakter)" }, { status: 400 });
    }

    const mutation = await db.select().from(therapistMutations).where(eq(therapistMutations.id, id)).limit(1);
    if (mutation.length === 0) {
      return NextResponse.json({ error: "Surat mutasi tidak ditemukan" }, { status: 404 });
    }

    const m = mutation[0];

    if (m.status !== "EXECUTED") {
      return NextResponse.json({ error: `Hanya surat mutasi berstatus EXECUTED (sudah berlaku) yang bisa di-reverse. Status saat ini: ${m.status}` }, { status: 400 });
    }

    // Verify therapist's current branchId is still toBranchId (hasn't been mutated again)
    const therapist = await db.select().from(therapists).where(eq(therapists.id, m.therapistId)).limit(1);
    if (therapist.length === 0) {
      return NextResponse.json({ error: "Terapis tidak ditemukan" }, { status: 404 });
    }

    if (therapist[0].branchId !== m.toBranchId) {
      return NextResponse.json({
        error: "Terapis sudah dipindahkan ke cabang lain setelah mutasi ini. Tidak bisa melakukan rollback."
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Reverse: update therapist branchId back to fromBranchId
    await db.update(therapists).set({
      branchId: m.fromBranchId,
    }).where(eq(therapists.id, m.therapistId));

    // Update mutation status
    await db.update(therapistMutations).set({
      status: "REVERSED",
      reversedBy: session.id,
      reversedByName: session.name,
      reversedAt: now,
      reversedReason: reversedReason.trim(),
      updatedAt: now,
    }).where(eq(therapistMutations.id, id));

    // System log
    await db.insert(systemLogs).values({
      id: crypto.randomUUID(),
      userId: session.id,
      userName: session.name,
      action: "REVERSE_MUTATION",
      entityType: "therapist_mutation",
      entityId: id,
      details: JSON.stringify({
        mutationNumber: m.mutationNumber,
        therapistName: therapist[0].name,
        reversedFrom: m.toBranchId,
        reversedTo: m.fromBranchId,
        reversedReason: reversedReason.trim(),
      }),
    });

    return NextResponse.json({ success: true, message: "Mutasi berhasil di-reverse. Terapis dikembalikan ke cabang asal." });
  } catch (error) {
    console.error("PUT /api/therapist-mutations/[id]/reverse error:", error);
    return NextResponse.json({ error: "Gagal melakukan rollback mutasi" }, { status: 500 });
  }
}
