import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logSystemAction } from "@/lib/logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, durationMinutes, category, isActive } = body;

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
      category: category !== undefined ? category : undefined,
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
    const { id } = await params;

    // Instead of hard delete, we do soft delete
    const existing = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (existing.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    const result = await db.update(services).set({
      isActive: false,
    }).where(eq(services.id, id)).returning();

    if (result.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    await logSystemAction("DELETE_SERVICE", "service", id, `Layanan dinonaktifkan: ${existing[0].name}`);

    return Response.json({ success: true, message: "Layanan berhasil dinonaktifkan" });
  } catch (error) {
    console.error("DELETE /api/services/[id] error:", error);
    return Response.json({ error: "Gagal menghapus layanan" }, { status: 500 });
  }
}
