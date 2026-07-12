import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default async function PromoTicketPage({ params }: { params: Promise<{ id: string }> }) {
  // Assuming Next.js 15 structure where params might be a Promise, but let's await it
  const { id } = await params;
  const ticketCode = id;

  const bookings = await db
    .select()
    .from(promoBookings)
    .where(eq(promoBookings.ticketCode, ticketCode))
    .limit(1);

  if (bookings.length === 0) {
    notFound();
  }

  const booking = bookings[0];

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        {/* Ticket Header */}
        <div className="bg-emerald-600 p-6 text-center text-white relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-neutral-950 rounded-full"></div>
          <h2 className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">Navara Reflexology</h2>
          <h1 className="text-2xl font-bold">E-Ticket Promo Bekam</h1>
        </div>
        
        {/* Cutout circles */}
        <div className="flex justify-between items-center bg-white -mt-4 relative z-10 px-0">
          <div className="w-8 h-8 bg-neutral-950 rounded-full -ml-4"></div>
          <div className="flex-1 border-t-2 border-dashed border-neutral-300 mx-2"></div>
          <div className="w-8 h-8 bg-neutral-950 rounded-full -mr-4"></div>
        </div>

        {/* Ticket Body */}
        <div className="p-8 text-neutral-900 bg-white flex flex-col items-center">
          <div className="bg-neutral-100 p-4 rounded-2xl mb-6">
            <QRCodeSVG value={ticketCode} size={180} level="M" />
          </div>
          
          <h2 className="text-2xl font-bold mb-6 tracking-wide text-emerald-700">{ticketCode}</h2>

          <div className="w-full space-y-4 text-left border-t border-neutral-100 pt-6">
            <div>
              <p className="text-xs text-neutral-500 uppercase font-semibold">Nama Pasien</p>
              <p className="text-lg font-medium">{booking.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">Tanggal</p>
                <p className="text-lg font-medium">{booking.bookingDate}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">Jam</p>
                <p className="text-lg font-medium">{booking.bookingTime}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">Terapis</p>
                <p className="text-lg font-medium">{booking.gender === "L" ? "Ikhwan (Pria)" : "Akhwat (Wanita)"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">Status</p>
                <p className="text-lg font-medium text-emerald-600">Terdaftar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-100 p-4 text-center">
          <p className="text-xs text-neutral-500 mb-4">
            Silakan screenshot halaman ini atau tunjukkan pesan WhatsApp yang telah kami kirimkan saat Anda datang ke klinik.
          </p>
          <Link href="/">
            <button className="text-emerald-600 text-sm font-semibold hover:underline">
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
