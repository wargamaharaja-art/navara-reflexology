"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Slot = { time: string; availableL: number; availableP: number };

export default function PromoBookingPage() {
  const router = useRouter();
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [gender, setGender] = useState<"L" | "P">("L");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Booking Form State
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/promo/slots?date=${date}`);
        const data = await res.json();
        if (data.slots) {
          setSlots(data.slots);
        } else {
          setError(data.error || "Gagal mengambil jadwal");
        }
      } catch (err) {
        setError("Terjadi kesalahan jaringan.");
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [date]);

  const handleSelectSlot = async (time: string, availableCount: number) => {
    if (availableCount <= 0) return;
    if (bookingId) return; // Prevent clicking another slot while locking one

    setError("");
    // Lock the slot
    try {
      const res = await fetch("/api/promo/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, gender }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingId(data.bookingId);
        setSelectedTime(time);
      } else {
        setError(data.error || "Slot ini baru saja diambil orang lain.");
        // Refresh slots
        const slotsRes = await fetch(`/api/promo/slots?date=${date}`);
        const slotsData = await slotsRes.json();
        if (slotsData.slots) setSlots(slotsData.slots);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengunci slot.");
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError("Nama dan Nomor WhatsApp wajib diisi.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/promo/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/promo/ticket/${data.ticketCode}`);
      } else {
        setError(data.error || "Gagal mengkonfirmasi pemesanan.");
        setSubmitting(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat konfirmasi.");
      setSubmitting(false);
    }
  };

  const cancelLock = () => {
    setBookingId("");
    setSelectedTime("");
    setName("");
    setPhone("");
    // Idealnya kita bisa menambahkan endpoint /api/promo/unlock untuk release manual, 
    // tapi karena sistem otomatis expire setelah 10 menit, ini cukup untuk UI.
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pilih Jadwal Promo</h1>
        <p className="text-neutral-400 mb-8">Pilih tanggal dan jam kedatangan Anda.</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Form Filter */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm text-neutral-400 mb-2">Pilih Tanggal</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              min={new Date().toISOString().split("T")[0]}
              disabled={!!bookingId}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-neutral-400 mb-2">Jenis Kelamin (Penting untuk penugasan terapis)</label>
            <div className="flex bg-neutral-950 rounded-lg p-1 border border-neutral-800">
              <button 
                onClick={() => setGender("L")}
                disabled={!!bookingId}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${gender === "L" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"}`}
              >
                Laki-laki (Ikhwan)
              </button>
              <button 
                onClick={() => setGender("P")}
                disabled={!!bookingId}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${gender === "P" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"}`}
              >
                Perempuan (Akhwat)
              </button>
            </div>
          </div>
        </div>

        {/* Slots Visualisasi */}
        {!bookingId ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Slot Tersedia ({gender === "L" ? "Ikhwan" : "Akhwat"})</h2>
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slots.map((s, idx) => {
                  const isIkhwan = gender === "L";
                  const available = isIkhwan ? s.availableL : s.availableP;
                  const total = isIkhwan ? 10 : 8;
                  const isFull = available === 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectSlot(s.time, available)}
                      disabled={isFull}
                      className={`relative flex flex-col items-center p-4 rounded-xl border transition-all ${
                        isFull 
                          ? "bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed"
                          : "bg-neutral-900 border-neutral-700 hover:border-emerald-500 hover:bg-emerald-900/20"
                      }`}
                    >
                      <span className={`text-lg font-bold ${isFull ? "text-neutral-500" : "text-white"}`}>{s.time}</span>
                      
                      {/* Visualisasi Kursi/Bed */}
                      <div className="flex gap-1 mt-3 flex-wrap justify-center w-full">
                        {Array.from({ length: total }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-sm ${i < (total - available) ? "bg-red-500" : "bg-emerald-500"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-neutral-400 mt-2">Sisa {available} bed</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-emerald-500/50 rounded-2xl p-6 md:p-8 animate-fade-in shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <h2 className="text-2xl font-semibold mb-2">Lengkapi Data Pemesanan</h2>
            <p className="text-emerald-400 mb-6">Jadwal Anda ({date} pukul {selectedTime}) berhasil dikunci sementara selama 10 menit. Segera isi form di bawah.</p>
            
            <form onSubmit={handleConfirm}>
              <div className="mb-4">
                <label className="block text-sm text-neutral-400 mb-2">Nama Lengkap</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-neutral-400 mb-2">Nomor WhatsApp</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Contoh: 081234567890"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={cancelLock}
                  className="px-6 py-3 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-3 font-medium transition-colors flex justify-center items-center"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Konfirmasi & Dapatkan Tiket"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
