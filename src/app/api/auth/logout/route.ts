import { deleteSession } from "@/lib/auth";

// POST /api/auth/logout — Admin logout
export async function POST() {
  try {
    await deleteSession();
    return Response.json({ message: "Logout berhasil" });
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    return Response.json({ error: "Gagal melakukan logout" }, { status: 500 });
  }
}
