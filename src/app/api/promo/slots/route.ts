import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { eq, and, gt, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    // Clean up expired locked slots (older than 10 mins) implicitly by not counting them
    // OR we could just query active slots:
    // status = CONFIRMED OR (status = LOCKED AND lockedUntil > now)
    const now = new Date().toISOString();

    const bookings = await db
      .select({
        bookingTime: promoBookings.bookingTime,
        gender: promoBookings.gender,
        status: promoBookings.status,
      })
      .from(promoBookings)
      .where(
        and(
          eq(promoBookings.bookingDate, date),
          or(
            eq(promoBookings.status, "CONFIRMED"),
            and(
              eq(promoBookings.status, "LOCKED"),
              gt(promoBookings.lockedUntil, now)
            )
          )
        )
      );

    // Hitung kuota per jam (Ikhwan max 10, Akhwat max 8)
    const slotCounts: Record<string, { L: number; P: number }> = {};
    
    // Asumsi jam operasional promo: 09:00 - 21:00, interval 30 menit
    const operationalHours = [];
    for (let h = 9; h < 21; h++) {
      const hourStr = h.toString().padStart(2, "0");
      operationalHours.push(`${hourStr}:00`);
      operationalHours.push(`${hourStr}:30`);
    }
    operationalHours.push("21:00");

    // Initialize all slots
    for (const time of operationalHours) {
      slotCounts[time] = { L: 0, P: 0 };
    }

    // Accumulate booked slots
    for (const b of bookings) {
      if (slotCounts[b.bookingTime]) {
        slotCounts[b.bookingTime][b.gender as "L" | "P"]++;
      }
    }

    // Format output
    const availableSlots = operationalHours.map(time => {
      const count = slotCounts[time];
      return {
        time,
        availableL: Math.max(0, 10 - count.L),
        availableP: Math.max(0, 8 - count.P),
      };
    });

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("GET /api/promo/slots error:", error);
    return NextResponse.json({ error: "Gagal mengambil slot" }, { status: 500 });
  }
}
