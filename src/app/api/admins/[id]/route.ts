import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, username, role, branchId, isActive, password } = body;

    const existing = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Safety checks for self-updates
    if (id === session.id) {
      if (isActive === false) {
        return NextResponse.json({ error: "Anda tidak dapat menonaktifkan diri sendiri" }, { status: 400 });
      }
      if (role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Anda tidak dapat mengubah peran Anda sendiri" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username.toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (branchId !== undefined) updateData.branchId = role === "SUPER_ADMIN" ? null : (branchId || null);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = hashPassword(password);

    await db.update(admins).set(updateData).where(eq(admins.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admins/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui admin" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === session.id) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus diri sendiri" }, { status: 400 });
    }

    await db.delete(admins).where(eq(admins.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admins/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus admin" }, { status: 500 });
  }
}
