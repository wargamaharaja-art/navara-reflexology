import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { eq, and, gt, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, time, gender } = body;

    if (!date || !time || !gender) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const maxSlots = gender === "L" ? 10 : 8;
    const now = new Date();
    
    // Check current occupancy
    const activeBookings = await db
      .select()
      .from(promoBookings)
      .where(
        and(
          eq(promoBookings.bookingDate, date),
          eq(promoBookings.bookingTime, time),
          eq(promoBookings.gender, gender),
          or(
            eq(promoBookings.status, "CONFIRMED"),
            and(
              eq(promoBookings.status, "LOCKED"),
              gt(promoBookings.lockedUntil, now.toISOString())
            )
          )
        )
      );

    if (activeBookings.length >= maxSlots) {
      return NextResponse.json({ error: "Slot sudah penuh" }, { status: 400 });
    }

    const lockDurationMs = 10 * 60 * 1000; // 10 minutes
    const lockedUntil = new Date(now.getTime() + lockDurationMs).toISOString();
    const newId = `promo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create locked booking (dummy name and phone for now, will be updated on confirm)
    await db.insert(promoBookings).values({
      id: newId,
      name: "GUEST",
      phone: "0000",
      gender,
      bookingDate: date,
      bookingTime: time,
      status: "LOCKED",
      lockedUntil,
    });

    return NextResponse.json({ 
      success: true, 
      bookingId: newId, 
      lockedUntil 
    });
  } catch (error) {
    console.error("POST /api/promo/book error:", error);
    return NextResponse.json({ error: "Gagal mengunci slot" }, { status: 500 });
  }
}
