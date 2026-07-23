import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID booking diperlukan" }, { status: 400 });
    }

    // Hapus data booking dari database
    const deletedBooking = await db
      .delete(promoBookings)
      .where(eq(promoBookings.id, id))
      .returning();

    if (deletedBooking.length === 0) {
      return NextResponse.json({ error: "Data booking tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Data booking berhasil dihapus" 
    });
  } catch (error) {
    console.error("DELETE /api/promo/bookings/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus data booking" }, { status: 500 });
  }
}
