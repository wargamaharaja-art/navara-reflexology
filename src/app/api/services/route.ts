import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq, or, isNull, and } from "drizzle-orm";

import { getActiveBranchFilter, getSession } from "@/lib/auth";

// GET /api/services — List all active services (or all if ?all=true)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    let branchFilter = searchParams.get("branchId") || await getActiveBranchFilter();
    if (branchFilter === "ALL") branchFilter = null;

    let query = db.select().from(services);
    
    const conditions = [];
    if (!all) {
      conditions.push(eq(services.isActive, true));
    }
    if (branchFilter) {
      conditions.push(or(eq(services.branchId, branchFilter), isNull(services.branchId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;

    return Response.json({ data: result });
  } catch (error) {
    console.error("GET /api/services error:", error);
    return Response.json({ error: "Gagal mengambil data layanan" }, { status: 500 });
  }
}

// POST /api/services — Create a new service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, durationMinutes, globalCommission, category, isActive, branchId } = body;

    if (!name || !description || price === undefined || !durationMinutes) {
      return Response.json({ error: "Data layanan tidak lengkap" }, { status: 400 });
    }
    
    const session = await getSession();
    let targetBranch = branchId;
    if (session?.role !== "SUPER_ADMIN" && session?.branchId) {
      targetBranch = session.branchId; // Force branch to user's branch
    } else if (targetBranch === "ALL" || !targetBranch) {
      targetBranch = null;
    }

    const newId = `SRV-${Date.now()}`;
    const result = await db.insert(services).values({
      id: newId,
      name,
      description,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      globalCommission: globalCommission !== undefined ? Number(globalCommission) : 0,
      category: category || "Paket Treatment",
      branchId: targetBranch || null,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return Response.json({ error: "Gagal membuat layanan baru" }, { status: 500 });
  }
}
