import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// GET: Ambil semua booking promo yang sudah CONFIRMED
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await db
      .select()
      .from(promoBookings)
      .where(eq(promoBookings.status, "CONFIRMED"))
      .orderBy(desc(promoBookings.createdAt));

    return NextResponse.json({ data: bookings });
  } catch (error) {
    console.error("GET /api/promo/bookings error:", error);
    return NextResponse.json({ error: "Gagal mengambil data booking" }, { status: 500 });
  }
}
