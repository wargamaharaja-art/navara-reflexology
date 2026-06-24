import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchFilter = await getActiveBranchFilter();
    
    let query = db
      .select({ id: reservations.id })
      .from(reservations)
      .where(eq(reservations.status, "PENDING"));

    if (branchFilter) {
      query = db
        .select({ id: reservations.id })
        .from(reservations)
        .where(and(eq(reservations.status, "PENDING"), eq(reservations.branchId, branchFilter)));
    }

    const res = await query;
    return NextResponse.json({ success: true, count: res.length });
  } catch (error) {
    console.error("GET /api/reservations/pending-count error:", error);
    return NextResponse.json({ error: "Gagal memuat jumlah reservasi" }, { status: 500 });
  }
}
