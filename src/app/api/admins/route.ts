import { db } from "@/lib/db";
import { admins, branches } from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
      .select({
        id: admins.id,
        username: admins.username,
        name: admins.name,
        role: admins.role,
        branchId: admins.branchId,
        isActive: admins.isActive,
        createdAt: admins.createdAt,
        branchName: branches.name,
      })
      .from(admins)
      .leftJoin(branches, eq(admins.branchId, branches.id))
      .orderBy(desc(admins.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admins error:", error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, password, name, role, branchId } = body;

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Check if username already exists
    const existing = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    const newAdmin = {
      id: `adm-${Date.now()}`,
      username: username.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      role: role as "SUPER_ADMIN" | "BRANCH_ADMIN",
      branchId: role === "SUPER_ADMIN" ? null : (branchId || null),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.insert(admins).values(newAdmin);

    // Return without passwordHash
    const { passwordHash: _, ...result } = newAdmin;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/admins error:", error);
    return NextResponse.json({ error: "Gagal menambahkan admin" }, { status: 500 });
  }
}
