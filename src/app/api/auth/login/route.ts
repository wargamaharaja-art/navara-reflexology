import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { createSession, verifyPassword, hashPassword, getDefaultPermissions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import fs from "fs";
import path from "path";

function logAttempt(username: string, status: string, details?: string, userAgent?: string) {
  try {
    const logFilePath = path.join(process.cwd(), "login_attempts.log");
    const logEntry = `[${new Date().toISOString()}] UserAgent: ${userAgent || "unknown"} | Username: ${username} | Status: ${status} | Details: ${details || ""}\n`;
    fs.appendFileSync(logFilePath, logEntry);
  } catch (err) {
    console.error("Failed to write to login_attempts.log", err);
  }
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

    // 1. Cek apakah ada admin di database sama sekali
    const dbAdmins = await db.select().from(admins);

    if (dbAdmins.length === 0) {
      // Database kosong, gunakan fallback environment variable
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      if (username !== adminUsername || password !== adminPassword) {
        logAttempt(username, "FAILED", "Credentials mismatch (Fallback Mode)", userAgent);
        return Response.json({ error: "Kredensial salah (Mode Fallback)" }, { status: 401 });
      }

      // Auto-seed: buat Super Admin di DB agar login berikutnya pakai DB
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

      await db.insert(admins).values(newAdmin);

      await createSession({
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
        branchId: newAdmin.branchId,
        permissions: defaultPerms,
      });

      logAttempt(username, "SUCCESS", "Login successful (Fallback seeded)", userAgent);
      return Response.json({ message: "Login berhasil (Fallback seeded)" });
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
    return Response.json({ message: "Login berhasil" });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    logAttempt(username, "ERROR", error instanceof Error ? error.message : String(error), userAgent);
    return Response.json({ error: "Gagal melakukan login" }, { status: 500 });
  }
}
