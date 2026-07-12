import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, name, phone } = body;

    if (!bookingId || !name || !phone) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Cek apakah booking ada dan masih dalam status LOCKED
    const bookingArr = await db
      .select()
      .from(promoBookings)
      .where(and(eq(promoBookings.id, bookingId), eq(promoBookings.status, "LOCKED")));

    if (bookingArr.length === 0) {
      return NextResponse.json({ error: "Sesi pemesanan tidak ditemukan atau sudah kadaluarsa" }, { status: 404 });
    }

    const booking = bookingArr[0];
    const now = new Date().toISOString();

    if (booking.lockedUntil && booking.lockedUntil < now) {
      return NextResponse.json({ error: "Sesi pemesanan sudah kadaluarsa" }, { status: 400 });
    }

    // Generate Ticket Code (misal NVR-PROMO-[Random 4 digit])
    const ticketCode = `NVR-PROMO-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update status ke CONFIRMED
    await db
      .update(promoBookings)
      .set({
        name,
        phone,
        status: "CONFIRMED",
        ticketCode,
      })
      .where(eq(promoBookings.id, bookingId));

    // Kirim WhatsApp (Asynchronous)
    const waMessage = `Assalamu'alaikum Kak ${name},\n\nTerima kasih telah mendaftar Promo Grand Opening Bekam Gratis di Navara Reflexology.\n\nDetail Reservasi:\nTanggal: ${booking.bookingDate}\nJam: ${booking.bookingTime}\nTiket: ${ticketCode}\n\nMohon tunjukkan pesan ini atau E-Ticket saat kedatangan.\nSemoga sehat selalu!`;
    sendWhatsAppNotification(phone, waMessage).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      ticketCode 
    });
  } catch (error) {
    console.error("POST /api/promo/confirm error:", error);
    return NextResponse.json({ error: "Gagal mengkonfirmasi pemesanan" }, { status: 500 });
  }
}
