import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "radja-bekam-session";
const SESSION_SECRET = process.env.SESSION_SECRET || "some-very-secret-key-1234567890-abcdef-radja-bekam";

export interface AdminSession {
  id: string;
  username: string;
  name: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "THERAPIST" | "CASHIER" | "INVESTOR";
  branchId: string | null;
  permissions: string[];
}

// Helper for default permissions based on role
export function getDefaultPermissions(role: string): string[] {
  const superAdminPerms = [
    "DASHBOARD_ANALITIK",
    "RESERVASI_ONLINE",
    "BUKUPASIEN_REKAMMEDIS",
    "PEGAWAI_TERAPIS", "PEGAWAI_STAFF", "PEGAWAI_ABSENSI", "PEGAWAI_SLIP",
    "INVENTARIS_BARANG",
    "KEUANGAN_PEMASUKAN", "KEUANGAN_PENGELUARAN", "KEUANGAN_MUTASI", "KEUANGAN_LABARUGI",
    "PENGATURAN_CABANG", "PENGATURAN_PENGGUNA", "PENGATURAN_KOMISI"
  ];

  switch (role) {
    case "SUPER_ADMIN":
      return superAdminPerms;
    case "BRANCH_ADMIN":
      return superAdminPerms.filter(p => !p.startsWith("PENGATURAN_CABANG") && !p.startsWith("PENGATURAN_PENGGUNA") && !p.startsWith("PENGATURAN_KOMISI"));
    case "CASHIER":
      return ["DASHBOARD_ANALITIK", "RESERVASI_ONLINE", "BUKUPASIEN_REKAMMEDIS", "INVENTARIS_BARANG"];
    case "THERAPIST":
      return ["DASHBOARD_ANALITIK", "BUKUPASIEN_REKAMMEDIS"];
    case "INVESTOR":
      return ["DASHBOARD_ANALITIK", "KEUANGAN_PEMASUKAN", "KEUANGAN_PENGELUARAN", "KEUANGAN_MUTASI", "KEUANGAN_LABARUGI"];
    default:
      return [];
  }
}

// Simple token signing helper using standard Node crypto
function signData(data: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(data);
  return hmac.digest("hex");
}

export async function createSession(sessionData: AdminSession): Promise<void> {
  const dataStr = JSON.stringify(sessionData);
  const dataBase64 = Buffer.from(dataStr).toString("base64");
  const signature = signData(dataBase64);
  const cookieValue = `${dataBase64}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function getSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie) {
      if (process.env.NODE_ENV === "development") {
        return {
          id: "dev-super-admin",
          username: "admin",
          name: "Developer Admin",
          role: "SUPER_ADMIN",
          branchId: null,
          permissions: getDefaultPermissions("SUPER_ADMIN"),
        };
      }
      return null;
    }
    const parts = sessionCookie.value.split(".");
    if (parts.length !== 2) return null;

    const [dataBase64, signature] = parts;
    const expectedSignature = signData(dataBase64);
    if (signature !== expectedSignature) return null;

    const dataStr = Buffer.from(dataBase64, "base64").toString("utf-8");
    return JSON.parse(dataStr) as AdminSession;
  } catch (error: any) {
    if (error && typeof error === "object" && error.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("Error retrieving admin session:", error);
    return null;
  }
}

export async function verifySession(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  
  // Also delete selected branch cookie if present
  cookieStore.delete("radja-bekam-selected-branch");
}

export async function getActiveBranchFilter(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  if (session.role === "BRANCH_ADMIN") {
    return session.branchId;
  }

  // Super admin: read the selected branch cookie
  const cookieStore = await cookies();
  const selectedBranch = cookieStore.get("radja-bekam-selected-branch")?.value;
  return selectedBranch && selectedBranch !== "ALL" ? selectedBranch : null;
}

export async function checkBranchAccess(recordBranchId: string | null): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "SUPER_ADMIN" || session.role === "INVESTOR") return true;
  return session.branchId === recordBranchId;
}

export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "SUPER_ADMIN") return true; // Super admin can do anything
  return allowedRoles.includes(session.role);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === newHash;
  } catch {
    return false;
  }
}
