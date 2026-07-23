import { db } from "@/lib/db";
import { promoBookings, patients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// POST: Daftarkan pasien promo ke Buku Pasien secara manual
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "ID booking diperlukan" }, { status: 400 });
    }

    // Ambil data booking
    const bookingArr = await db
      .select()
      .from(promoBookings)
      .where(and(eq(promoBookings.id, bookingId), eq(promoBookings.status, "CONFIRMED")));

    if (bookingArr.length === 0) {
      return NextResponse.json({ error: "Booking tidak ditemukan atau belum dikonfirmasi" }, { status: 404 });
    }

    const booking = bookingArr[0];

    // Cek apakah pasien sudah terdaftar berdasarkan nomor telepon
    const existingPatient = await db
      .select()
      .from(patients)
      .where(eq(patients.phone, booking.phone))
      .limit(1);

    if (existingPatient.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Pasien sudah terdaftar di Buku Pasien",
        alreadyRegistered: true,
        patientId: existingPatient[0].id,
      });
    }

    // Daftarkan pasien baru
    const patientId = `P-PROMO-${Date.now()}`;
    await db.insert(patients).values({
      id: patientId,
      name: booking.name,
      phone: booking.phone,
      address: null,
      gender: booking.gender,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Pasien berhasil didaftarkan ke Buku Pasien",
      alreadyRegistered: false,
      patientId,
    });
  } catch (error) {
    console.error("POST /api/promo/register-patient error:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan pasien" }, { status: 500 });
  }
}
