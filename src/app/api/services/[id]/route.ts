import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logSystemAction } from "@/lib/logger";

import { getSession } from "@/lib/auth";

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
    const { name, description, price, durationMinutes, globalCommission, category, isActive, branchId } = body;

    const existing = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (existing.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }
    const oldPrice = existing[0].price;

    const result = await db.update(services).set({
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
      globalCommission: globalCommission !== undefined ? Number(globalCommission) : undefined,
      category: category !== undefined ? category : undefined,
      branchId: branchId !== undefined ? branchId : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    }).where(eq(services.id, id)).returning();

    if (result.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    if (price !== undefined && Number(price) !== oldPrice) {
      await logSystemAction("UPDATE_PRICE", "service", id, `Harga layanan ${name || existing[0].name} diubah dari ${oldPrice} menjadi ${price}`);
    }

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("PUT /api/services/[id] error:", error);
    return Response.json({ error: "Gagal memperbarui layanan" }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (existing.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    try {
      // Attempt hard delete
      await db.delete(services).where(eq(services.id, id));
      await logSystemAction("DELETE_SERVICE", "service", id, `Layanan dihapus permanen: ${existing[0].name}`);
      return Response.json({ success: true, message: "Layanan berhasil dihapus permanen" });
    } catch (dbError: any) {
      // Check for foreign key constraint violation (Postgres error code 23503)
      if (dbError.code === '23503') {
        // Fallback to soft delete
        const result = await db.update(services).set({
          isActive: false,
        }).where(eq(services.id, id)).returning();

        await logSystemAction("DELETE_SERVICE", "service", id, `Layanan dinonaktifkan: ${existing[0].name}`);
        return Response.json({ success: true, message: "Layanan dinonaktifkan karena sudah memiliki transaksi" });
      } else {
        throw dbError;
      }
    }
  } catch (error: any) {
    console.error("DELETE /api/services/[id] error:", error);
    // Return the actual error message to help debug
    return Response.json({ error: "Gagal menghapus layanan: " + (error?.message || String(error)) }, { status: 500 });
  }
}
