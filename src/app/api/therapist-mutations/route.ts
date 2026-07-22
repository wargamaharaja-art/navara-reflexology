import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistMutations, therapists, branches, systemLogs } from "@/lib/db/schema";
import { eq, and, desc, or, inArray, like, sql } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

// GET /api/therapist-mutations — List mutations with filters
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perms = session.permissions || [];
    if (!perms.includes("PEGAWAI_MUTASI") && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const therapistId = searchParams.get("therapistId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];

    if (status && status !== "ALL") {
      conditions.push(eq(therapistMutations.status, status as "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXECUTED" | "REVERSED"));
    }

    if (therapistId) {
      conditions.push(eq(therapistMutations.therapistId, therapistId));
    }

    // BRANCH_ADMIN: only see mutations related to their branch
    if (session.role === "BRANCH_ADMIN" && session.branchId) {
      conditions.push(
        or(
          eq(therapistMutations.fromBranchId, session.branchId),
          eq(therapistMutations.toBranchId, session.branchId)
        )
      );
    }

    // Super Admin branch filter (from cookie)
    const branchFilter = await getActiveBranchFilter();
    if (branchFilter) {
      conditions.push(
        or(
          eq(therapistMutations.fromBranchId, branchFilter),
          eq(therapistMutations.toBranchId, branchFilter)
        )
      );
    }

    const mutations = await db
      .select({
        id: therapistMutations.id,
        mutationNumber: therapistMutations.mutationNumber,
        therapistId: therapistMutations.therapistId,
        therapistName: therapists.name,
        therapistSpecialization: therapists.specialization,
        fromBranchId: therapistMutations.fromBranchId,
        toBranchId: therapistMutations.toBranchId,
        effectiveDate: therapistMutations.effectiveDate,
        reason: therapistMutations.reason,
        notes: therapistMutations.notes,
        status: therapistMutations.status,
        requestedBy: therapistMutations.requestedBy,
        requestedByName: therapistMutations.requestedByName,
        approvedBy: therapistMutations.approvedBy,
        approvedByName: therapistMutations.approvedByName,
        approvedAt: therapistMutations.approvedAt,
        executedAt: therapistMutations.executedAt,
        rejectedReason: therapistMutations.rejectedReason,
        reversedBy: therapistMutations.reversedBy,
        reversedByName: therapistMutations.reversedByName,
        reversedAt: therapistMutations.reversedAt,
        reversedReason: therapistMutations.reversedReason,
        createdAt: therapistMutations.createdAt,
        updatedAt: therapistMutations.updatedAt,
      })
      .from(therapistMutations)
      .leftJoin(therapists, eq(therapistMutations.therapistId, therapists.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(therapistMutations.createdAt));

    // Fetch branch names for all unique branch IDs
    const branchIds = new Set<string>();
    for (const m of mutations) {
      if (m.fromBranchId) branchIds.add(m.fromBranchId);
      if (m.toBranchId) branchIds.add(m.toBranchId);
    }

    let branchMap: Record<string, string> = {};
    if (branchIds.size > 0) {
      const branchData = await db
        .select({ id: branches.id, name: branches.name })
        .from(branches)
        .where(inArray(branches.id, Array.from(branchIds)));
      branchMap = Object.fromEntries(branchData.map(b => [b.id, b.name]));
    }

    const enriched = mutations.map(m => ({
      ...m,
      fromBranchName: m.fromBranchId ? (branchMap[m.fromBranchId] || "—") : "—",
      toBranchName: branchMap[m.toBranchId] || "—",
    }));

    // Stats
    const stats = {
      draft: enriched.filter(m => m.status === "DRAFT").length,
      approved: enriched.filter(m => m.status === "APPROVED").length,
      executed: enriched.filter(m => m.status === "EXECUTED").length,
      rejected: enriched.filter(m => m.status === "REJECTED").length,
      reversed: enriched.filter(m => m.status === "REVERSED").length,
    };

    return NextResponse.json({ success: true, data: enriched, stats });
  } catch (error) {
    console.error("GET /api/therapist-mutations error:", error);
    return NextResponse.json({ error: "Gagal mengambil data surat mutasi" }, { status: 500 });
  }
}

// POST /api/therapist-mutations — Create new mutation
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perms = session.permissions || [];
    if (!perms.includes("PEGAWAI_MUTASI") && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { therapistId, toBranchId, effectiveDate, reason, notes, autoApprove } = body;

    // Validate required fields
    if (!therapistId || !toBranchId || !effectiveDate || !reason) {
      return NextResponse.json({ error: "Field wajib tidak lengkap: terapis, cabang tujuan, tanggal efektif, dan alasan harus diisi" }, { status: 400 });
    }

    if (reason.trim().length < 10) {
      return NextResponse.json({ error: "Alasan mutasi minimal 10 karakter" }, { status: 400 });
    }

    // Validate effective date >= today
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    if (effectiveDate < today) {
      return NextResponse.json({ error: "Tanggal efektif tidak boleh sebelum hari ini" }, { status: 400 });
    }

    // Fetch therapist
    const therapistData = await db.select().from(therapists).where(eq(therapists.id, therapistId)).limit(1);
    if (therapistData.length === 0) {
      return NextResponse.json({ error: "Terapis tidak ditemukan" }, { status: 404 });
    }
    const therapist = therapistData[0];

    if (!therapist.isActive) {
      return NextResponse.json({ error: "Terapis tidak aktif, tidak bisa dimutasi" }, { status: 400 });
    }

    // Check branch access for BRANCH_ADMIN
    if (session.role === "BRANCH_ADMIN" && session.branchId && therapist.branchId !== session.branchId) {
      return NextResponse.json({ error: "Anda hanya bisa memutasi terapis dari cabang Anda" }, { status: 403 });
    }

    // Validate destination branch exists and is active
    const destBranch = await db.select().from(branches).where(eq(branches.id, toBranchId)).limit(1);
    if (destBranch.length === 0) {
      return NextResponse.json({ error: "Cabang tujuan tidak ditemukan" }, { status: 404 });
    }
    if (!destBranch[0].isActive) {
      return NextResponse.json({ error: "Cabang tujuan tidak aktif" }, { status: 400 });
    }

    // Validate destination != origin
    if (therapist.branchId === toBranchId) {
      return NextResponse.json({ error: "Cabang tujuan harus berbeda dari cabang asal" }, { status: 400 });
    }

    // Check for existing pending mutation (DRAFT or APPROVED)
    const existingPending = await db
      .select()
      .from(therapistMutations)
      .where(
        and(
          eq(therapistMutations.therapistId, therapistId),
          inArray(therapistMutations.status, ["DRAFT", "APPROVED"])
        )
      );

    if (existingPending.length > 0) {
      return NextResponse.json({
        error: "Terapis ini sudah memiliki surat mutasi yang sedang diproses (DRAFT/APPROVED). Batalkan terlebih dahulu sebelum membuat yang baru."
      }, { status: 400 });
    }

    // Generate mutation number: MUT-YYYYMMDD-SEQ
    const dateStr = today.replace(/-/g, "");
    const existingToday = await db
      .select({ mutationNumber: therapistMutations.mutationNumber })
      .from(therapistMutations)
      .where(like(therapistMutations.mutationNumber, `MUT-${dateStr}-%`));
    const seq = String(existingToday.length + 1).padStart(3, "0");
    const mutationNumber = `MUT-${dateStr}-${seq}`;

    // Determine status
    const shouldAutoApprove = autoApprove === true && session.role === "SUPER_ADMIN";
    const now = new Date().toISOString();

    const newMutation = {
      id: crypto.randomUUID(),
      mutationNumber,
      therapistId,
      fromBranchId: therapist.branchId,
      toBranchId,
      effectiveDate,
      reason: reason.trim(),
      notes: notes?.trim() || null,
      status: shouldAutoApprove ? "APPROVED" as const : "DRAFT" as const,
      requestedBy: session.id,
      requestedByName: session.name,
      approvedBy: shouldAutoApprove ? session.id : null,
      approvedByName: shouldAutoApprove ? session.name : null,
      approvedAt: shouldAutoApprove ? now : null,
      executedAt: null,
      rejectedReason: null,
      reversedBy: null,
      reversedByName: null,
      reversedAt: null,
      reversedReason: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(therapistMutations).values(newMutation);

    // System log
    await db.insert(systemLogs).values({
      id: crypto.randomUUID(),
      userId: session.id,
      userName: session.name,
      action: shouldAutoApprove ? "CREATE_AND_APPROVE_MUTATION" : "CREATE_MUTATION",
      entityType: "therapist_mutation",
      entityId: newMutation.id,
      details: JSON.stringify({
        mutationNumber,
        therapistName: therapist.name,
        fromBranchId: therapist.branchId,
        toBranchId,
        effectiveDate,
        autoApproved: shouldAutoApprove,
      }),
    });

    return NextResponse.json({ success: true, data: newMutation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/therapist-mutations error:", error);
    return NextResponse.json({ error: "Gagal membuat surat mutasi" }, { status: 500 });
  }
}
