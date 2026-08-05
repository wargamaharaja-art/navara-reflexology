import { db } from "@/lib/db";
import { services, serviceBranchPrices, branches } from "@/lib/db/schema";
import { eq, or, isNull, and } from "drizzle-orm";

import { getActiveBranchFilter, getSession } from "@/lib/auth";

// GET /api/services — List all active services (or all if ?all=true)
// Returns effectivePrice and effectiveCommission based on branch context
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    let branchFilter = searchParams.get("branchId") || await getActiveBranchFilter();
    if (branchFilter === "ALL") branchFilter = null;

    let targetBrand: string | null = null;
    if (branchFilter) {
      // Find the brand of the selected branch
      const branchData = await db.select({ brand: branches.brand }).from(branches).where(eq(branches.id, branchFilter)).limit(1);
      if (branchData.length > 0) {
        targetBrand = branchData[0].brand;
      }
    }

    let query = db.select().from(services);
    
    const conditions = [];
    if (!all) {
      conditions.push(eq(services.isActive, true));
    }
    
    // 1. Filter by branchId (Specific to branch OR global)
    if (branchFilter) {
      conditions.push(or(eq(services.branchId, branchFilter), isNull(services.branchId)));
    }
    
    // 2. Filter by BRAND (To separate Navara vs Radja Bekam)
    if (targetBrand) {
      conditions.push(eq(services.brand, targetBrand));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;

    // If we have a branch context, apply branch-specific price overrides
    if (branchFilter) {
      const branchPrices = await db
        .select()
        .from(serviceBranchPrices)
        .where(eq(serviceBranchPrices.branchId, branchFilter));

      const priceMap = new Map(
        branchPrices.map(bp => [bp.serviceId, bp])
      );

      const enriched = result.map(s => {
        const override = priceMap.get(s.id);
        return {
          ...s,
          effectivePrice: override ? override.price : s.price,
          effectiveCommission: override?.commission ?? s.globalCommission,
          hasOverride: !!override,
        };
      });

      return Response.json({ data: enriched });
    }

    // No branch context — return default prices
    const enriched = result.map(s => ({
      ...s,
      effectivePrice: s.price,
      effectiveCommission: s.globalCommission,
      hasOverride: false,
    }));

    return Response.json({ data: enriched });
  } catch (error) {
    console.error("GET /api/services error:", error);
    return Response.json({ error: "Gagal mengambil data layanan" }, { status: 500 });
  }
}

// POST /api/services — Create a new service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, durationMinutes, globalCommission, category, isActive, branchId, brand } = body;

    if (!name || !description || price === undefined || !durationMinutes) {
      return Response.json({ error: "Data layanan tidak lengkap" }, { status: 400 });
    }
    
    const session = await getSession();
    let targetBranch = branchId;
    let targetBrand = brand || "NAVARA";

    if (session?.role !== "SUPER_ADMIN" && session?.branchId) {
      targetBranch = session.branchId; // Force branch to user's branch
      // Fetch branch brand
      const bData = await db.select({ brand: branches.brand }).from(branches).where(eq(branches.id, session.branchId)).limit(1);
      if (bData.length > 0) targetBrand = bData[0].brand;
    } else if (targetBranch === "ALL" || !targetBranch) {
      targetBranch = null;
    }

    const newId = `SRV-${Date.now()}`;
    const result = await db.insert(services).values({
      id: newId,
      name,
      brand: targetBrand,
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
