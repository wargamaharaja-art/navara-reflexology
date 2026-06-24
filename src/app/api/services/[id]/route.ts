import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, durationMinutes, category, isActive } = body;

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
    const result = await db.update(services).set({
      isActive: false,
    }).where(eq(services.id, id)).returning();

    if (result.length === 0) {
      return Response.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    return Response.json({ success: true, message: "Layanan berhasil dinonaktifkan" });
  } catch (error) {
    console.error("DELETE /api/services/[id] error:", error);
    return Response.json({ error: "Gagal menghapus layanan" }, { status: 500 });
  }
}
