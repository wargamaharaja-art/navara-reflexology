import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { hasRole, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const isSuperAdmin = await hasRole(["SUPER_ADMIN"]);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allAdmins = await db.select({
      id: admins.id,
      username: admins.username,
      name: admins.name,
      role: admins.role,
      branchId: admins.branchId,
      permissions: admins.permissions,
      isActive: admins.isActive,
      createdAt: admins.createdAt
    }).from(admins);

    return NextResponse.json({ data: allAdmins });
  } catch (error: any) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengguna" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isSuperAdmin = await hasRole(["SUPER_ADMIN"]);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, name, role, branchId, permissions } = body;

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Check if username exists
    const existing = await db.select().from(admins).where(eq(admins.username, username));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const newId = `usr-${Date.now()}`;

    await db.insert(admins).values({
      id: newId,
      username,
      passwordHash,
      name,
      role,
      branchId: (role === "SUPER_ADMIN" || role === "INVESTOR") ? null : branchId,
      permissions: permissions ? JSON.stringify(permissions) : JSON.stringify([]),
      isActive: true
    });

    return NextResponse.json({ success: true, message: "Pengguna berhasil dibuat" });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Gagal membuat pengguna" }, { status: 500 });
  }
}
