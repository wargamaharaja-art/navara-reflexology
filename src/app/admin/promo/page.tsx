"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Send, UserPlus, CheckCircle2, Search, RefreshCw, Loader2, Trash2, Clock } from "lucide-react";

type PromoBooking = {
  id: string;
  name: string;
  phone: string;
  gender: "L" | "P";
  bookingDate: string;
  bookingTime: string;
  status: string;
  ticketCode: string | null;
  createdAt: string;
};

export default function AdminPromoDashboard() {
  const [bookings, setBookings] = useState<PromoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredPhones, setRegisteredPhones] = useState<Set<string>>(new Set());
  const [registeringIds, setRegisteringIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [baseUrl, setBaseUrl] = useState("");

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/promo/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data booking:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch registered patients to check status
  const checkRegisteredPatients = useCallback(async (bookingsList: PromoBooking[]) => {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        const patientPhones = new Set<string>(
          (data.data || []).map((p: { phone: string }) => p.phone)
        );
        setRegisteredPhones(patientPhones);
      }
    } catch (err) {
      console.error("Gagal mengecek data pasien:", err);
    }
  }, []);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (bookings.length > 0) {
      checkRegisteredPatients(bookings);
    }
  }, [bookings, checkRegisteredPatients]);

  // Register a single patient
  const handleRegisterPatient = async (bookingId: string) => {
    setRegisteringIds(prev => new Set(prev).add(bookingId));
    try {
      const res = await fetch("/api/promo/register-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.alreadyRegistered) {
          alert("Pasien sudah terdaftar di Master Data Pasien. Silakan ke menu Buku Pasien -> + Catat Kunjungan.");
        } else {
          alert("✅ Pasien berhasil didaftarkan ke Master Data! Silakan ke menu Buku Pasien dan klik '+ Catat Kunjungan' untuk menjadwalkan terapinya.");
        }
        // Refresh data
        await checkRegisteredPatients(bookings);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mendaftarkan pasien.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setRegisteringIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  // Delete a promo booking
  const handleDeleteBooking = async (bookingId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data promo untuk ${name}?`)) return;

    setDeletingIds(prev => new Set(prev).add(bookingId));
    try {
      const res = await fetch(`/api/promo/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Data booking berhasil dihapus!");
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus data booking.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  // Register all unregistered patients
  const handleRegisterAll = async () => {
    const unregistered = bookings.filter(b => !registeredPhones.has(b.phone));
    if (unregistered.length === 0) {
      alert("Semua pasien promo sudah terdaftar di Buku Pasien.");
      return;
    }

    if (!confirm(`Daftarkan ${unregistered.length} pasien ke Buku Pasien?`)) return;

    let successCount = 0;
    for (const b of unregistered) {
      try {
        const res = await fetch("/api/promo/register-patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: b.id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.alreadyRegistered) successCount++;
        }
      } catch (err) {
        console.error(`Gagal mendaftarkan ${b.name}:`, err);
      }
    }

    alert(`✅ ${successCount} pasien baru berhasil didaftarkan ke Master Data! Selanjutnya silakan ke menu Buku Pasien -> + Catat Kunjungan untuk menjadwalkan terapinya.`);
    await checkRegisteredPatients(bookings);
  };

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.ticketCode?.toLowerCase().includes(q)
    );
  });

  const totalIkhwan = bookings.filter(b => b.gender === "L").length;
  const totalAkhwat = bookings.filter(b => b.gender === "P").length;
  const totalRegistered = bookings.filter(b => registeredPhones.has(b.phone)).length;
  const totalUnregistered = bookings.length - totalRegistered;

  const dateSlots = bookings.reduce((acc, booking) => {
    const date = booking.bookingDate;
    const time = booking.bookingTime;
    const gender = booking.gender; // "L" or "P"
    if (date && time) {
      if (!acc[date]) acc[date] = {};
      if (!acc[date][time]) acc[date][time] = { L: 0, P: 0 };
      acc[date][time][gender] += 1;
    }
    return acc;
  }, {} as Record<string, Record<string, { L: number; P: number }>>);

  const sortedDates = Object.keys(dateSlots).sort((a, b) => a.localeCompare(b));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Memuat data promo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Promo Bekam Gratis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Pendaftar</h3>
          <p className="text-3xl font-bold text-emerald-600">{bookings.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Ikhwan (Laki-laki)</h3>
          <p className="text-3xl font-bold text-emerald-600">{totalIkhwan}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Akhwat (Perempuan)</h3>
          <p className="text-3xl font-bold text-emerald-600">{totalAkhwat}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Terdaftar di Buku Pasien</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-blue-600">{totalRegistered}</p>
            <span className="text-sm text-slate-400">/ {bookings.length}</span>
          </div>
          {totalUnregistered > 0 && (
            <p className="text-xs text-amber-600 mt-1 font-medium">
              {totalUnregistered} belum terdaftar
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Summary Jadwal Kedatangan
        </h3>
        {sortedDates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDates.map((date) => {
              const times = dateSlots[date];
              const sortedTimes = Object.entries(times).sort(([a], [b]) => a.localeCompare(b));
              return (
                <div key={date} className="border rounded-lg p-3 bg-slate-50">
                  <div className="font-medium text-slate-700 mb-2 border-b pb-2">{date}</div>
                  <div className="flex flex-wrap gap-2">
                    {sortedTimes.map(([time, counts]) => (
                      <div key={time} className="flex items-center gap-1 bg-white border border-slate-200 pl-2.5 pr-1.5 py-1 rounded-md text-sm shadow-sm">
                        <span className="font-semibold text-slate-600 mr-1">{time}</span>
                        {counts.L > 0 && (
                          <span title="Ikhwan" className="bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded">
                            {counts.L}
                          </span>
                        )}
                        {counts.P > 0 && (
                          <span title="Akhwat" className="bg-pink-100 text-pink-700 text-xs font-bold px-1.5 py-0.5 rounded">
                            {counts.P}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada jadwal yang di-booking.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Daftar Reservasi Promo</h2>
          <div className="flex items-center gap-2">
            {totalUnregistered > 0 && (
              <button
                onClick={handleRegisterAll}
                className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Daftarkan Semua ({totalUnregistered})
              </button>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari Tiket/Nama..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>
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
                <th className="px-6 py-3 font-medium text-slate-800">Status Pasien</th>
                <th className="px-6 py-3 font-medium text-slate-800 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const isRegistered = registeredPhones.has(b.phone);
                  const isRegistering = registeringIds.has(b.id);
                  const isDeleting = deletingIds.has(b.id);

                  return (
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
                      <td className="px-6 py-4">
                        {isRegistered ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Terdaftar
                            </span>
                            <Link
                              href={`/admin/visits?promo=true&phone=${b.phone}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-colors"
                            >
                              + Buat Kunjungan
                            </Link>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRegisterPatient(b.id)}
                            disabled={isRegistering}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isRegistering ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Mendaftar...</>
                            ) : (
                              <><UserPlus className="w-3 h-3" /> Daftarkan</>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a 
                            href={`https://wa.me/${b.phone.replace(/^0/, '62').replace(/^\+62/, '62')}?text=${encodeURIComponent(`Halo ${b.name},\n\nTerima kasih telah melakukan pendaftaran Promo Bekam Gratis di Navara Reflexology.\n\nBerikut adalah link E-Ticket Anda:\n${baseUrl}/promo/ticket/${b.id}\n\nSilakan tunjukkan E-Ticket ini kepada petugas kami saat kedatangan pada:\nTanggal: ${b.bookingDate}\nJam: ${b.bookingTime}\n\nSampai jumpa!`)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" /> Kirim E-Ticket
                          </a>
                          <button
                            onClick={() => handleDeleteBooking(b.id, b.name)}
                            disabled={isDeleting}
                            title="Hapus Data"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? "Tidak ditemukan hasil pencarian" : "Belum ada pendaftar promo"}
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
