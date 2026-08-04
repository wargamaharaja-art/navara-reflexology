"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, CalendarHeart, Phone, MapPin, Activity, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function ReservationsClient({
  data,
  activeTherapists,
  pendingCount,
  visits,
  session,
  branches,
}: {
  data: any[];
  activeTherapists: any[];
  pendingCount: number;
  visits: any[];
  session?: any;
  branches?: any[];
}) {
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const filteredData = data;
  const filteredVisits = visits;

  const startOfWeek = new Date(currentWeek);
  startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00"];

  const confirmReservationAction = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const therapistId = formData.get("therapistId");
    
    await fetch("/api/reservations/confirm", {
      method: "POST",
      body: JSON.stringify({ id, therapistId }),
      headers: { "Content-Type": "application/json" }
    });
    window.location.reload();
  };

  const rejectReservationAction = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    await fetch("/api/reservations/reject", {
      method: "POST",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" }
    });
    window.location.reload();
  };

  return (
    <div className="space-y-8 p-2 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <CalendarHeart className="w-8 h-8 text-blue-100" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Reservasi & Jadwal</h1>
            <p className="text-blue-100 mt-1 text-sm font-medium">Kelola jadwal dan konfirmasi pasien masuk</p>
          </div>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-4">
          <div>
            <p className="text-xs text-blue-100 font-bold uppercase tracking-wider">Menunggu Konfirmasi</p>
            <p className="text-2xl font-black text-amber-300">{pendingCount}</p>
          </div>
          {pendingCount > 0 && (
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
        <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl shadow-sm w-max">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "list" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <List className="w-4 h-4" />
            Daftar Reservasi
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "calendar" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <CalendarIcon className="w-4 h-4" />
            Kalender Jadwal
          </button>
        </div>

      </div>

      {activeTab === "list" && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 relative">
          <div className="overflow-x-auto">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarHeart className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Reservasi</h3>
                <p className="text-gray-500 text-sm">Reservasi dari pasien yang masuk via web akan muncul di sini.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-separate border-spacing-y-3">
                <thead className="text-xs text-gray-500 uppercase bg-transparent">
                  <tr>
                    <th className="px-4 py-2 font-bold tracking-wider">Pelanggan</th>
                    <th className="hidden sm:table-cell px-4 py-2 font-bold tracking-wider">Kontak</th>
                    <th className="px-4 py-2 font-bold tracking-wider">Layanan & Cabang</th>
                    <th className="hidden md:table-cell px-4 py-2 font-bold tracking-wider">Jadwal</th>
                    <th className="px-4 py-2 font-bold tracking-wider">Status</th>
                    <th className="px-4 py-2 font-bold tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(({ res, branchName, serviceName }) => (
                    <tr key={res.id} className="bg-white hover:bg-slate-50 transition-colors shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] ring-1 ring-gray-100 rounded-2xl group">
                      <td className="px-4 py-4 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                            {res.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{res.customerName}</p>
                            {/* Kontak dipindah ke sini untuk mobile */}
                            <div className="sm:hidden flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{res.customerPhone}</span>
                            </div>
                            <div className="md:hidden flex items-center gap-1 text-xs text-blue-600 mt-0.5 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{res.date} • {res.time}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{res.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-indigo-700 font-bold">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            <span>{serviceName || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{branchName || "Unknown"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-gray-800 bg-gray-100 inline-block px-2 py-0.5 rounded-md w-max">{res.date}</p>
                          <p className="text-xs font-semibold text-blue-600">{res.time} WIB</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {res.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <Clock className="h-4 w-4" /> Menunggu
                          </span>
                        )}
                        {res.status === "CONFIRMED" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            <CheckCircle className="h-4 w-4" /> Dikonfirmasi
                          </span>
                        )}
                        {res.status === "CANCELLED" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <XCircle className="h-4 w-4" /> Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 rounded-r-2xl text-right">
                        {res.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <form onSubmit={(e) => confirmReservationAction(e, res.id)} className="flex gap-2 items-center">
                              <select name="therapistId" required className="bg-gray-50 border border-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium">
                                <option value="">-- Pilih Terapis --</option>
                                {activeTherapists
                                  .filter((t) => t.branchId === res.branchId)
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                              </select>
                              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi
                              </button>
                            </form>
                            <form onSubmit={(e) => rejectReservationAction(e, res.id)}>
                              <button type="submit" className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium italic">Diproses</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Kalender Minggu Ini</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d); }}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-sm">
                {weekDays[0].toLocaleDateString("id-ID", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button 
                onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d); }}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <div className="min-w-[800px] border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              {/* Header */}
              <div className="grid grid-cols-8 divide-x divide-gray-200 border-b border-gray-200 bg-white">
                <div className="p-3 text-center text-xs font-bold text-gray-500 uppercase">Jam</div>
                {weekDays.map(day => (
                  <div key={day.toISOString()} className={`p-3 text-center ${day.toDateString() === new Date().toDateString() ? "bg-blue-50/50" : ""}`}>
                    <div className="text-xs font-bold text-gray-500 uppercase">{day.toLocaleDateString("id-ID", { weekday: "short" })}</div>
                    <div className={`text-lg font-black mt-1 ${day.toDateString() === new Date().toDateString() ? "text-blue-600" : "text-gray-900"}`}>{day.getDate()}</div>
                  </div>
                ))}
              </div>
              
              {/* Body */}
              <div className="divide-y divide-gray-200">
                {timeSlots.map(time => (
                  <div key={time} className="grid grid-cols-8 divide-x divide-gray-200">
                    <div className="p-3 text-center text-xs font-bold text-gray-500 bg-white flex items-center justify-center">
                      {time}
                    </div>
                    {weekDays.map(day => {
                      const dateStr = day.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
                      
                      // Find items for this slot
                      const dayReservations = filteredData.filter(d => d.res.date === dateStr && d.res.time.startsWith(time.split(":")[0]));
                      const dayVisits = filteredVisits.filter(v => v.visitDate === dateStr && v.visitTime.startsWith(time.split(":")[0]));
                      
                      return (
                        <div key={`${dateStr}-${time}`} className={`p-2 min-h-[80px] bg-white transition-colors hover:bg-gray-50/80`}>
                          <div className="flex flex-col gap-2">
                            {dayReservations.map(r => (
                              <div key={r.res.id} className={`p-2 rounded-lg text-[10px] border ${
                                r.res.status === "PENDING" ? "bg-amber-50 border-amber-200 text-amber-800" :
                                r.res.status === "CONFIRMED" ? "bg-blue-50 border-blue-200 text-blue-800" :
                                "bg-gray-50 border-gray-200 text-gray-500 opacity-60"
                              }`}>
                                <div className="font-bold truncate">{r.res.customerName}</div>
                                <div className="truncate opacity-80">{r.serviceName}</div>
                                <div className="font-mono mt-1 opacity-60">{r.res.status}</div>
                              </div>
                            ))}
                            {dayVisits.map(v => (
                              <div key={v.id} className="p-2 rounded-lg text-[10px] border bg-indigo-50 border-indigo-200 text-indigo-800 shadow-sm">
                                <div className="font-bold truncate">{v.patientName}</div>
                                <div className="truncate opacity-80">{v.serviceName}</div>
                                <div className="font-mono mt-1 opacity-60 text-indigo-600 font-semibold">{v.therapistName || "Walk-in"}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
