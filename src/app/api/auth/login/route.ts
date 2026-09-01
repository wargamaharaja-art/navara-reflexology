import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { createSession, verifyPassword, hashPassword, getDefaultPermissions } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
function logAttempt(username: string, status: string, details?: string, userAgent?: string) {
  console.log(`[LOGIN ATTEMPT] ${username} | ${status} | ${details}`);
}

// POST /api/auth/login — Admin login
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "unknown";
  let username = "";
  try {
    const body = await request.json();
    username = body.username || "";
    const { password } = body;

    if (!username || !password) {
      logAttempt(username || "empty", "FAILED", "Missing credentials", userAgent);
      return Response.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    // 1. Cek apakah ada admin di database sama sekali (dengan auto-create table jika belum ada)
    let dbAdmins: any[] = [];
    try {
      dbAdmins = await db.select().from(admins);
    } catch (dbErr: any) {
      console.warn("Could not query admins table, attempting to ensure table exists:", dbErr?.message);
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS admins (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'BRANCH_ADMIN',
            branch_id TEXT,
            permissions TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TEXT NOT NULL
          );
        `);
        dbAdmins = await db.select().from(admins);
      } catch (tableErr: any) {
        console.error("Failed to create admins table or connect to DB:", tableErr?.message);
      }
    }

    if (dbAdmins.length === 0) {
      // Database kosong atau belum siap, gunakan fallback environment variable
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      if (username !== adminUsername || password !== adminPassword) {
        logAttempt(username, "FAILED", "Credentials mismatch (Fallback Mode)", userAgent);
        return Response.json({ error: "Username atau password salah (Kredensial default: admin / admin123)" }, { status: 401 });
      }

      // Auto-seed: buat Super Admin di DB jika DB tersedia
      const defaultPerms = getDefaultPermissions("SUPER_ADMIN");
      const newAdmin = {
        id: `adm-${Date.now()}`,
        username: adminUsername,
        passwordHash: hashPassword(adminPassword),
        name: "Super Admin",
        role: "SUPER_ADMIN" as const,
        branchId: null,
        permissions: JSON.stringify(defaultPerms),
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      try {
        await db.insert(admins).values(newAdmin);
      } catch (insertErr) {
        console.warn("Could not seed admin to DB, proceeding with memory session:", insertErr);
      }

      await createSession({
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
        branchId: newAdmin.branchId,
        permissions: defaultPerms,
      });

      logAttempt(username, "SUCCESS", "Login successful (Fallback Mode)", userAgent);
      return Response.json({ 
        message: "Login berhasil (Fallback Mode)",
        token: "mobile-token-fallback",
        user: { id: newAdmin.id, name: newAdmin.name, role: newAdmin.role }
      });
    }

    // 2. Cari admin yang cocok di database
    const matchedAdmin = dbAdmins.find(a => a.username.toLowerCase() === username.toLowerCase());

    if (!matchedAdmin) {
      logAttempt(username, "FAILED", "Username not found in database", userAgent);
      return Response.json({ error: "Username atau password salah" }, { status: 401 });
    }

    if (!matchedAdmin.isActive) {
      if (matchedAdmin.role === "SUPER_ADMIN") {
        // Auto-activate super admin if accidentally deactivated
        await db.update(admins).set({ isActive: true }).where(eq(admins.id, matchedAdmin.id));
        matchedAdmin.isActive = true;
      } else {
        logAttempt(username, "FAILED", "Admin account is inactive", userAgent);
        return Response.json({ error: "Akun Anda dinonaktifkan. Hubungi Super Admin." }, { status: 403 });
      }
    }

    const isValid = verifyPassword(password, matchedAdmin.passwordHash);
    if (!isValid) {
      logAttempt(username, "FAILED", "Wrong password", userAgent);
      return Response.json({ error: "Username atau password salah" }, { status: 401 });
    }

    // 3. Migrate & Parse Permissions
    let userPermissions: string[] = [];
    if (matchedAdmin.permissions) {
      try {
        userPermissions = JSON.parse(matchedAdmin.permissions);
      } catch (e) {
        userPermissions = getDefaultPermissions(matchedAdmin.role);
      }
    } else {
      userPermissions = getDefaultPermissions(matchedAdmin.role);
      // Save migration permanently
      await db.update(admins)
        .set({ permissions: JSON.stringify(userPermissions) })
        .where(eq(admins.id, matchedAdmin.id));
    }

    // 4. Buat sesi
    await createSession({
      id: matchedAdmin.id,
      username: matchedAdmin.username,
      name: matchedAdmin.name,
      role: matchedAdmin.role as any,
      branchId: matchedAdmin.branchId,
      permissions: userPermissions,
    });

    logAttempt(username, "SUCCESS", "Login successful", userAgent);
    return Response.json({ 
      message: "Login berhasil",
      token: "mobile-token",
      user: { id: matchedAdmin.id, name: matchedAdmin.name, role: matchedAdmin.role }
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    logAttempt(username, "ERROR", error instanceof Error ? error.message : String(error), userAgent);
    return Response.json({ error: "Gagal melakukan login" }, { status: 500 });
  }
}
