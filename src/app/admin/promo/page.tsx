import { db } from "@/lib/db";
import { promoBookings } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPromoDashboard() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Ambil data yang CONFIRMED saja
  const bookings = await db
    .select()
    .from(promoBookings)
    .where(eq(promoBookings.status, "CONFIRMED"))
    .orderBy(desc(promoBookings.createdAt));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Promo Bekam Gratis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Pendaftar</h3>
          <p className="text-3xl font-bold text-emerald-600">{bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Ikhwan (Laki-laki)</h3>
          <p className="text-3xl font-bold text-emerald-600">
            {bookings.filter(b => b.gender === "L").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Akhwat (Perempuan)</h3>
          <p className="text-3xl font-bold text-emerald-600">
            {bookings.filter(b => b.gender === "P").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-slate-800">Daftar Reservasi Promo</h2>
          {/* Untuk validasi scanner (opsional) */}
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Cari Tiket/Nama..." 
              className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-800">Waktu Booking</th>
                <th className="px-6 py-3 font-medium text-slate-800">Nama Lengkap</th>
                <th className="px-6 py-3 font-medium text-slate-800">WhatsApp</th>
                <th className="px-6 py-3 font-medium text-slate-800">Gender</th>
                <th className="px-6 py-3 font-medium text-slate-800">Kode Tiket</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span className="block font-medium text-slate-900">{b.bookingDate}</span>
                      <span className="text-xs text-slate-500">{b.bookingTime}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{b.name}</td>
                    <td className="px-6 py-4">
                      <a href={`https://wa.me/${b.phone}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">
                        {b.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.gender === "L" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                        {b.gender === "L" ? "Ikhwan" : "Akhwat"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded border text-slate-700">
                        {b.ticketCode}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada pendaftar promo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
