import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { hasRole, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isSuperAdmin = await hasRole(["SUPER_ADMIN"]);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, branchId, isActive, password, permissions } = body;

    const updateData: any = {
      name,
      role,
      branchId: (role === "SUPER_ADMIN" || role === "INVESTOR") ? null : branchId,
      isActive
    };

    if (permissions && Array.isArray(permissions)) {
      updateData.permissions = JSON.stringify(permissions);
    }

    if (password) {
      updateData.passwordHash = hashPassword(password);
    }

    await db.update(admins).set(updateData).where(eq(admins.id, id));

    return NextResponse.json({ success: true, message: "Pengguna berhasil diperbarui" });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isSuperAdmin = await hasRole(["SUPER_ADMIN"]);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(admins).where(eq(admins.id, id));

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
