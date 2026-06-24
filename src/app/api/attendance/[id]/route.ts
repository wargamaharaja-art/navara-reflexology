import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await db.delete(attendance).where(eq(attendance.id, id));

    return NextResponse.json({ message: "Absensi berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/attendance/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus absensi" }, { status: 500 });
  }
}
