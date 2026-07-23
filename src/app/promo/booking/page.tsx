"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, Phone, CheckCircle2, AlertCircle } from "lucide-react";

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
    if (bookingId) return;

    setError("");
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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pt-36 pb-20 selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Pilih Jadwal Promo</h1>
          <p className="text-slate-500 font-medium">Pilih tanggal dan jam kedatangan Anda untuk mendapatkan layanan terapi bekam gratis.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Filter */}
        <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 mb-10 flex flex-col md:flex-row gap-6 relative z-10">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Pilih Tanggal
            </label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
              min="2026-07-31"
              max="2026-08-02"
              disabled={!!bookingId}
            />
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
              <User className="w-4 h-4 text-emerald-500" />
              Pilih Gender Terapis
            </label>
            <div className="flex bg-slate-50 rounded-xl p-1.5 border border-gray-200 shadow-inner">
              <button 
                onClick={() => setGender("L")}
                disabled={!!bookingId}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${gender === "L" ? "bg-white text-emerald-700 shadow-sm ring-1 ring-gray-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                Laki-laki (Ikhwan)
              </button>
              <button 
                onClick={() => setGender("P")}
                disabled={!!bookingId}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${gender === "P" ? "bg-white text-emerald-700 shadow-sm ring-1 ring-gray-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                Perempuan (Akhwat)
              </button>
            </div>
          </div>
        </div>

        {/* Slots Visualisasi */}
        {!bookingId ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Slot Tersedia</h2>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500"></div> Tersedia</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500"></div> Penuh</div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-20">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
                      className={`relative flex flex-col items-center p-5 rounded-3xl border-2 transition-all duration-300 ${
                        isFull 
                          ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed grayscale"
                          : "bg-white border-transparent hover:border-emerald-500 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)] hover:-translate-y-1 cursor-pointer shadow-sm"
                      }`}
                    >
                      <span className={`text-2xl font-black mb-1 ${isFull ? "text-slate-400" : "text-slate-800"}`}>{s.time}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full mb-4 ${isFull ? "bg-gray-200 text-gray-500" : "bg-emerald-100 text-emerald-700"}`}>
                        Sisa {available} bed
                      </span>
                      
                      {/* Visualisasi Kursi/Bed */}
                      <div className="flex gap-1.5 flex-wrap justify-center w-full px-2">
                        {Array.from({ length: total }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3 rounded-sm ${i < (total - available) ? "bg-red-500 shadow-sm" : "bg-emerald-500 shadow-sm"}`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-emerald-100 rounded-3xl p-8 md:p-10 animate-fade-in shadow-[0_20px_60px_rgba(16,185,129,0.1)] relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Lengkapi Data Pemesanan</h2>
                </div>
              </div>
              <p className="text-slate-600 font-medium mb-8 pl-16">
                Jadwal Anda pada <strong className="text-emerald-700">{date} pukul {selectedTime}</strong> telah diamankan sementara. Segera isi form di bawah sebelum waktu habis.
              </p>
              
              <form onSubmit={handleConfirm} className="pl-0 md:pl-16">
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <User className="w-4 h-4 text-emerald-500" />
                    Nama Lengkap
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div className="mb-8">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    Nomor WhatsApp
                  </label>
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="button"
                    onClick={cancelLock}
                    className="px-8 py-4 rounded-xl border border-gray-200 text-slate-600 hover:bg-gray-50 hover:text-slate-900 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 py-4 font-bold transition-all hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] flex justify-center items-center"
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Konfirmasi & Dapatkan E-Ticket"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
