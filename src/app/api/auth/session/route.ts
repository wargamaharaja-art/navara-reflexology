import { getSession, getDefaultPermissions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      // Di mode development, jika tidak ada sesi (misal karena cookie terblokir di HP),
      // kita berikan sesi Super Admin tiruan agar mempermudah testing UI mobile.
      if (process.env.NODE_ENV === "development") {
        const mockAdmin = {
          id: "adm-mock-dev",
          username: "admin",
          name: "Owner (Dev Bypass)",
          role: "SUPER_ADMIN",
          branchId: null,
        };
        const mockSession = {
          id: mockAdmin.id,
          username: mockAdmin.username,
          name: mockAdmin.name,
          role: mockAdmin.role,
          branchId: mockAdmin.branchId,
          permissions: getDefaultPermissions(mockAdmin.role as any),
        };
        return NextResponse.json({
          authenticated: true,
          session: mockSession
        });
      }
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fallback for older sessions without permissions array or using old format
    if (!session.permissions || session.permissions.length === 0 || !session.permissions.some(p => p.includes("_"))) {
      session.permissions = getDefaultPermissions(session.role as any);
    }

    return NextResponse.json({ authenticated: true, session });
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return NextResponse.json({ error: "Gagal memuat sesi" }, { status: 500 });
  }
}
