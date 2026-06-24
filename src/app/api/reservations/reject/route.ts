import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID reservasi diperlukan" }, { status: 400 });
    }

    // Update reservation status to CANCELLED
    await db.update(reservations)
      .set({ status: "CANCELLED", updatedAt: new Date().toISOString() })
      .where(eq(reservations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting reservation:", error);
    return NextResponse.json({ error: "Gagal menolak reservasi" }, { status: 500 });
  }
}
