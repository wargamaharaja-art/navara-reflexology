import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistMutations, therapists, branches, settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/therapist-mutations/[id] — Detail satu surat mutasi
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const mutation = await db
      .select()
      .from(therapistMutations)
      .where(eq(therapistMutations.id, id))
      .limit(1);

    if (mutation.length === 0) {
      return NextResponse.json({ error: "Surat mutasi tidak ditemukan" }, { status: 404 });
    }

    const m = mutation[0];

    // Fetch therapist data
    const therapistData = await db
      .select()
      .from(therapists)
      .where(eq(therapists.id, m.therapistId))
      .limit(1);

    // Fetch branch names
    const allBranchIds = [m.fromBranchId, m.toBranchId].filter(Boolean) as string[];
    const branchData = allBranchIds.length > 0
      ? await db.select().from(branches).where(
          // Fetch all relevant branches
          eq(branches.id, allBranchIds[0])
        )
      : [];

    // If there are two different branches, fetch the second one too
    let fromBranch = null;
    let toBranch = null;

    if (m.fromBranchId) {
      const fb = await db.select().from(branches).where(eq(branches.id, m.fromBranchId)).limit(1);
      fromBranch = fb[0] || null;
    }
    const tb = await db.select().from(branches).where(eq(branches.id, m.toBranchId)).limit(1);
    toBranch = tb[0] || null;

    // Fetch company settings for letter header
    const companySettings = await db
      .select()
      .from(settings)
      .where(eq(settings.id, "company_info"))
      .limit(1);

    // Access control
    if (session.role === "BRANCH_ADMIN" && session.branchId) {
      if (m.fromBranchId !== session.branchId && m.toBranchId !== session.branchId) {
        return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke surat mutasi ini" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...m,
        therapist: therapistData[0] || null,
        fromBranch,
        toBranch,
        company: companySettings[0] || null,
      },
    });
  } catch (error) {
    console.error("GET /api/therapist-mutations/[id] error:", error);
    return NextResponse.json({ error: "Gagal mengambil detail surat mutasi" }, { status: 500 });
  }
}
