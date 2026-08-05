import { db } from "@/lib/db";
import { serviceBranchPrices, services } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

// GET /api/services/[id]/branch-prices — Get all branch price overrides for a service
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify service exists
    const svc = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (svc.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    const prices = await db
      .select()
      .from(serviceBranchPrices)
      .where(eq(serviceBranchPrices.serviceId, id));

    return Response.json({ data: prices });
  } catch (error) {
    console.error("GET /api/services/[id]/branch-prices error:", error);
    return Response.json({ error: "Gagal mengambil data harga cabang" }, { status: 500 });
  }
}

// PUT /api/services/[id]/branch-prices — Bulk upsert branch prices
// Body: { branchPrices: [{ branchId, price, commission? }] }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const perms = session?.permissions || [];
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "BRANCH_ADMIN" && session.role !== "CASHIER" && !perms.includes("LAYANAN_TERAPI"))) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { branchPrices } = body;

    if (!Array.isArray(branchPrices)) {
      return Response.json({ error: "branchPrices harus berupa array" }, { status: 400 });
    }

    // Verify service exists
    const svc = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (svc.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    // BRANCH_ADMIN can only update their own branch
    const isBranchAdmin = session.role === "BRANCH_ADMIN" || session.role === "CASHIER";

    await db.transaction(async (tx) => {
      for (const bp of branchPrices) {
        if (!bp.branchId || bp.price === undefined || bp.price === null) continue;

        // BRANCH_ADMIN can only set price for their own branch
        if (isBranchAdmin && bp.branchId !== session.branchId) {
          continue; // Silently skip other branches
        }

        const existing = await tx
          .select()
          .from(serviceBranchPrices)
          .where(
            and(
              eq(serviceBranchPrices.serviceId, id),
              eq(serviceBranchPrices.branchId, bp.branchId)
            )
          )
          .limit(1);

        if (bp.price === "" || bp.price === null) {
          // Delete override → revert to default
          if (existing.length > 0) {
            await tx.delete(serviceBranchPrices).where(eq(serviceBranchPrices.id, existing[0].id));
          }
        } else if (existing.length > 0) {
          // Update existing override
          await tx.update(serviceBranchPrices).set({
            price: Number(bp.price),
            commission: bp.commission !== undefined && bp.commission !== null && bp.commission !== ""
              ? Number(bp.commission)
              : null,
          }).where(eq(serviceBranchPrices.id, existing[0].id));
        } else {
          // Create new override
          await tx.insert(serviceBranchPrices).values({
            id: crypto.randomUUID(),
            serviceId: id,
            branchId: bp.branchId,
            price: Number(bp.price),
            commission: bp.commission !== undefined && bp.commission !== null && bp.commission !== ""
              ? Number(bp.commission)
              : null,
          });
        }
      }
    });

    // Return updated branch prices
    const updatedPrices = await db
      .select()
      .from(serviceBranchPrices)
      .where(eq(serviceBranchPrices.serviceId, id));

    return Response.json({ data: updatedPrices });
  } catch (error) {
    console.error("PUT /api/services/[id]/branch-prices error:", error);
    return Response.json({ error: "Gagal menyimpan harga cabang" }, { status: 500 });
  }
}
