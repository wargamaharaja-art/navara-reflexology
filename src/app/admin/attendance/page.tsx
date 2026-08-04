"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, Camera, UserCheck, Play, Image as ImageIcon, Search, Store } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Image from "next/image";

type AttendanceRecord = {
  therapistId: string;
  therapistName: string;
  branchId: string;
  attendanceId: string | null;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: "PRESENT" | "LATE" | "ABSENT";
  notes: string;
  photoUrl: string | null;
};

export default function AttendancePage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sessionRes, branchesRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/branches")
        ]);
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData);
        }
        
        if (branchesRes.ok) {
          const branchesJson = await branchesRes.json();
          setBranches(branchesJson.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchAttendance = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${targetDate}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance(date);
  }, [date, fetchAttendance]);

  const filteredRecords = records.filter(r => r.therapistName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <PageHeader 
          title="Laporan Absensi Terapis"
          description="Tinjau daftar kehadiran harian para terapis cabang berdasarkan foto bukti absensi Kiosk."
          icon={Users}
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 md:mt-0">

              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Cari terapis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none w-full shadow-sm transition-all"
                />
              </div>
              <div className="relative w-full sm:w-auto">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="attendance-date-picker"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none w-full cursor-pointer shadow-sm transition-all"
                />
              </div>
              <button
                onClick={() => router.push("/admin/attendance/kiosk")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all whitespace-nowrap active:scale-95"
              >
                <Play className="w-4 h-4" /> Buka Kiosk Absensi
              </button>
            </div>
          }
        />

        {/* Modal Foto */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700" onClick={e => e.stopPropagation()}>
              <img src={selectedPhoto} alt="Bukti Absensi" className="w-full h-auto object-contain max-h-[80vh]" />
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80"
              >
                X
              </button>
            </div>
          </div>
        )}

        {/* Attendance Log Table Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Foto Bukti</th>
                  <th className="px-6 py-4 font-bold">Nama Terapis</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Jam Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Sedang memuat laporan absensi...
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                      {searchQuery ? "Tidak ada terapis yang cocok dengan pencarian." : "Tidak ada terapis aktif di cabang Anda untuk tanggal ini."}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.therapistId} className="hover:bg-indigo-50/10 transition-colors group">
                      <td className="px-6 py-4">
                        {r.photoUrl ? (
                          <div 
                            className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-2 border-indigo-100 relative group/photo"
                            onClick={() => setSelectedPhoto(r.photoUrl)}
                          >
                            <Image src={r.photoUrl} alt={r.therapistName} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                            <ImageIcon className="w-5 h-5 opacity-50" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                          {r.therapistName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {!r.clockIn && !r.clockOut ? (
                           <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">BELUM ABSEN</span>
                         ) : (r.status === "LATE" || (r.clockIn && r.clockIn > "09:00")) ? (
                           <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">TERLAMBAT</span>
                         ) : (
                           <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">HADIR</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-gray-700">{r.clockIn || "--:--"}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
