"use client";

import { useState, useEffect } from "react";
import { Lock, Award, TrendingUp, Calendar, CreditCard, ChevronRight, CheckCircle2, ShieldCheck, AlertCircle, FileText, Star, Briefcase, MapPin } from "lucide-react";

type ReportData = {
  reportId: string;
  therapistId: string;
  month: string;
  totalTreatments: number;
  attendancePresent: number;
  attendanceLate: number;
  attendanceAbsent: number;
  attendancePermit: number;
  baseSalary: number;
  commissions: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  takeHomePay: number;
  notesStrengths: string;
  notesImprovements: string;
  notesTargets: string;
  rating: string;
  therapistName: string;
  specialization: string;
  branchName: string | null;
};

type Metadata = {
  id: string;
  month: string;
  therapistName: string;
};

export default function TherapistReportClientPage({ reportId }: { reportId: string }) {
  // States
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [pin, setPin] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch welcome metadata on load
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch(`/api/therapist-reports/${reportId}`);
        if (res.ok) {
          const json = await res.json();
          setMeta(json);
        } else {
          setError("Tautan tidak valid atau laporan tidak ditemukan.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal terhubung ke server.");
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, [reportId]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("PIN harus berupa angka lengkap");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/therapist-reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        const json = await res.json();
        setReport(json.data);
        setAuthenticated(true);
      } else {
        const json = await res.json();
        setError(json.error || "PIN keamanan salah.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi sistem.");
    } finally {
      setVerifying(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthReadable = (monthCode: string) => {
    const [y, m] = monthCode.split("-");
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Mempersiapkan dasbor aman...</p>
      </div>
    );
  }

  // Error state for basic load
  if (error && !authenticated && !meta) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-2xl text-red-500 mb-4 max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p className="font-bold">{error}</p>
        </div>
        <p className="text-slate-500 text-xs">Silakan hubungi tim HR/Operasional klinik untuk memverifikasi tautan ini.</p>
      </div>
    );
  }

  // STEP 1: PIN Verification Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl -z-10" />

        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-2xl shadow-lg text-white mb-4 animate-bounce">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Rapor & Slip Gaji Privat</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Halo <span className="text-indigo-400 font-bold">{meta?.therapistName}</span>, laporan bulanan Anda periode <span className="text-indigo-400 font-bold">{meta ? getMonthReadable(meta.month) : ""}</span> sudah siap.
            </p>
            <p className="text-slate-500 text-[10px] mt-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800/50">
              🔒 Terlindungi enkripsi data privat terapis
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 flex items-center gap-2.5 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIN Keamanan Terapis</label>
              <input
                id="therapist-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="Masukkan 6 digit PIN (Cth: DDMMYY)"
                className="w-full text-center tracking-[0.25em] px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white font-extrabold text-lg placeholder:tracking-normal placeholder:font-semibold placeholder:text-slate-600 transition-all"
              />
            </div>

            <button
              id="verify-pin-btn"
              type="submit"
              disabled={verifying || pin.length < 4}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Buka Rapor & Gaji
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // STEP 2: Dashboard Report Screen
  if (authenticated && report) {
    // Math indicators
    const hasCommissions = report.commissions > 0;
    const attendanceTotal = report.attendancePresent + report.attendanceLate + report.attendanceAbsent;
    const attendanceRate = attendanceTotal > 0 ? Math.round((report.attendancePresent / attendanceTotal) * 100) : 100;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-600/5 blur-3xl -z-10" />

        <div className="max-w-3xl mx-auto space-y-6 pb-12">

          {/* Header Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
            
            <div className="space-y-1.5 pl-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                {getMonthReadable(report.month)}
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight mt-2">{report.therapistName}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-xs">
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {report.specialization}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {report.branchName || "Pusat"}</span>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0 w-full sm:w-auto">
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Rating Kinerja</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="text-xl font-black text-white">{report.rating}</span>
                <span className="text-slate-500 text-xs">/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Section 1: Performance Metrics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" /> Performa & Absensi
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Treatments Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tindakan / Pasien</div>
                <div className="text-3xl font-black text-white mt-2 flex items-baseline gap-1">
                  {report.totalTreatments}
                  <span className="text-xs font-semibold text-slate-500">treatment</span>
                </div>
                <div className="text-slate-400 text-xs mt-3 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-900">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Kunjungan Selesai
                </div>
              </div>

              {/* Attendance Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tingkat Kehadiran</div>
                <div className="text-3xl font-black text-white mt-2 flex items-baseline gap-1">
                  {attendanceRate}%
                  <span className="text-xs font-semibold text-slate-500">rate</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-3 flex justify-between bg-slate-950 px-2 py-1 rounded-lg border border-slate-900 font-bold">
                  <span className="text-green-500">{report.attendancePresent} H</span>
                  <span className="text-amber-500">{report.attendanceLate} T</span>
                  <span className="text-red-500">{report.attendanceAbsent} A</span>
                  {report.attendancePermit > 0 && <span className="text-purple-400">{report.attendancePermit} I</span>}
                </div>
              </div>

              {/* KPI Reward Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Kepatuhan Kerja</div>
                <div className="text-3xl font-black text-white mt-2 flex items-baseline gap-1">
                  {report.attendanceAbsent === 0 ? "EXCELLENT" : "GOOD"}
                </div>
                <div className="text-slate-400 text-xs mt-3 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Log kehadiran terekam
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Payslip (Slip Gaji Digital) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Slip Gaji Digital Bulanan
            </h3>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
              
              {/* Income Breakdown */}
              <div className="space-y-3">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2">Komponen Pendapatan</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gaji Pokok Cabang</span>
                    <span className="font-semibold text-white">{formatRupiah(report.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Komisi Tindakan</span>
                    <span className="font-semibold text-emerald-400">+{formatRupiah(report.commissions)}</span>
                  </div>
                  {report.allowances > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tunjangan Makan / Transport</span>
                      <span className="font-semibold text-white">+{formatRupiah(report.allowances)}</span>
                    </div>
                  )}
                  {report.bonuses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bonus / Insentif Tambahan</span>
                      <span className="font-semibold text-white">+{formatRupiah(report.bonuses)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions Breakdown */}
              {report.deductions > 0 && (
                <div className="space-y-3">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2 text-red-400">Komponen Potongan</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Potongan (Kasbon / Denda)</span>
                      <span className="font-semibold text-red-400">-{formatRupiah(report.deductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Take-home Pay */}
              <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-2xl p-5 border border-indigo-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Total Gaji Diterima (THP)</div>
                  <div className="text-3xl font-black text-white mt-1">{formatRupiah(report.takeHomePay)}</div>
                </div>
                
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Telah Ditransfer
                </span>
              </div>

            </div>
          </div>

          {/* Section 3: Managerial Evaluations */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Kritik, Saran & Evaluasi Manajemen
            </h3>

            <div className="space-y-4">
              
              {/* Kelebihan */}
              {report.notesStrengths && (
                <div className="bg-gradient-to-r from-emerald-950/20 to-slate-900/40 border border-emerald-500/15 rounded-2xl p-5">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    🌟 Apresiasi / Kelebihan Bulan Ini
                  </h4>
                  <p className="text-slate-350 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{report.notesStrengths}</p>
                </div>
              )}

              {/* Area Perbaikan */}
              {report.notesImprovements && (
                <div className="bg-gradient-to-r from-amber-950/20 to-slate-900/40 border border-amber-500/15 rounded-2xl p-5">
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    ⚠️ Catatan & Area Perbaikan (Kritik)
                  </h4>
                  <p className="text-slate-350 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{report.notesImprovements}</p>
                </div>
              )}

              {/* Target */}
              {report.notesTargets && (
                <div className="bg-gradient-to-r from-indigo-950/20 to-slate-900/40 border border-indigo-500/15 rounded-2xl p-5">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    🚀 Target Kinerja Bulan Depan
                  </h4>
                  <p className="text-slate-350 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{report.notesTargets}</p>
                </div>
              )}

            </div>
          </div>

          {/* Confidential Footer */}
          <div className="text-center text-slate-600 text-[10px] space-y-1 mt-10">
            <p>Dokumen ini diterbitkan secara resmi & sah secara digital oleh Navara Reflexology.</p>
            <p className="font-semibold text-slate-500">Dilarang menyebarluaskan rincian gaji ini kepada pihak ketiga.</p>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
