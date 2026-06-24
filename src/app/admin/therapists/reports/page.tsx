"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle, AlertCircle, Save, Send, Copy, Award, Edit, Sparkles, AlertTriangle, User, DollarSign, Activity, Download } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type MonthlyReport = {
  id: string | null;
  therapistId: string;
  therapistName: string;
  branchId: string | null;
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
  isSaved: boolean;
};

export default function TherapistReportsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulking, setBulking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Modal Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<MonthlyReport | null>(null);

  const fetchReports = useCallback(async (targetMonth: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/therapist-reports?month=${targetMonth}`);
      if (res.ok) {
        const json = await res.json();
        setReports(json.data || []);
      } else {
        setMessage({ type: "error", text: "Gagal memuat data rapor terapis" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(month);
  }, [month, fetchReports]);

  const handleEditClick = (report: MonthlyReport) => {
    setActiveReport({ ...report });
    setIsModalOpen(true);
  };

  const handleModalInputChange = (field: keyof MonthlyReport, value: any) => {
    if (!activeReport) return;

    setActiveReport(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value } as MonthlyReport;

      // Recalculate Take-Home Pay dynamically if financial fields change
      if (
        field === "baseSalary" ||
        field === "commissions" ||
        field === "allowances" ||
        field === "bonuses" ||
        field === "deductions"
      ) {
        const salary = parseInt(String(updated.baseSalary)) || 0;
        const comms = parseInt(String(updated.commissions)) || 0;
        const allow = parseInt(String(updated.allowances)) || 0;
        const bonus = parseInt(String(updated.bonuses)) || 0;
        const deduct = parseInt(String(updated.deductions)) || 0;
        updated.takeHomePay = salary + comms + allow + bonus - deduct;
      }
      return updated;
    });
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/therapist-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeReport),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Rapor ${activeReport.therapistName} berhasil disimpan!` });
        setIsModalOpen(false);
        fetchReports(month);
      } else {
        const errJson = await res.json();
        setMessage({ type: "error", text: errJson.error || "Gagal menyimpan rapor" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    const unsaved = reports.filter(r => !r.isSaved);
    if (unsaved.length === 0) return alert("Semua laporan terapis untuk bulan ini sudah tersimpan.");
    if (!confirm(`Simpan masal ${unsaved.length} draft laporan terapis sekaligus?`)) return;

    setBulking(true);
    setMessage(null);
    let successCount = 0;

    try {
      for (const report of unsaved) {
        const res = await fetch("/api/therapist-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        });
        if (res.ok) successCount++;
      }

      setMessage({ type: "success", text: `Berhasil memproses & menyimpan ${successCount} laporan terapis!` });
      fetchReports(month);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan selama proses simpan masal" });
    } finally {
      setBulking(false);
    }
  };

  const handleCopyLink = (reportId: string | null) => {
    if (!reportId) return;
    const reportUrl = `${window.location.origin}/therapist/report/${reportId}`;
    navigator.clipboard.writeText(reportUrl);
    alert("Link rapor privat berhasil disalin ke clipboard!");
  };

  const handleSendWA = (report: MonthlyReport) => {
    if (!report.id) return;
    const reportUrl = `${window.location.origin}/therapist/report/${report.id}`;
    
    // Format month to readable string, e.g. June 2026
    const [yearStr, monthStr] = report.month.split("-");
    const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const readableMonth = dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    const messageText = `Halo ${report.therapistName}, berikut adalah Rapor Kinerja & Slip Gaji Bulanan Anda untuk periode *${readableMonth}*.\n\nSilakan buka tautan berikut untuk melihat rincian privat Anda:\n${reportUrl}\n\nMasukkan PIN keamanan Anda (6 digit Tanggal Lahir Anda: DDMMYY) untuk masuk. Terima kasih!`;
    
    // Clean phone number (replace starting '0' with '62' if necessary)
    // Here we can fetch the therapist's phone or assume they copy it. We direct to standard share.
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, "_blank");
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

  const handleExportCSV = () => {
    if (reports.length === 0) return alert("Tidak ada data untuk diekspor");
    const headers = [
      "Nama Terapis", "Total Pasien", "Kehadiran (H/T/A)", "Gaji Pokok", "Komisi", 
      "Tunjangan", "Bonus", "Potongan", "Take Home Pay"
    ];
    const csvContent = [
      headers.join(","),
      ...reports.map(r => [
        `"${r.therapistName}"`,
        r.totalTreatments,
        `"${r.attendancePresent}/${r.attendanceLate}/${r.attendanceAbsent}"`,
        r.baseSalary,
        r.commissions,
        r.allowances,
        r.bonuses,
        r.deductions,
        r.takeHomePay
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-penggajian-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <PageHeader 
          title="Rapor & Slip Gaji Terapis"
          description="Kelola slip gaji digital, metrik performa, dan link evaluasi privat terapis."
          icon={Award}
          rightContent={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                <input
                  id="report-month-picker"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-white/50 text-sm backdrop-blur-md outline-none [color-scheme:dark] cursor-pointer w-full sm:w-auto transition-all"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV Rekap
              </button>

              <button
                id="bulk-save-btn"
                onClick={handleBulkSave}
                disabled={loading || bulking || reports.filter(r => !r.isSaved).length === 0}
                className="bg-white text-indigo-900 hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-500 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all cursor-pointer text-sm"
              >
                {bulking ? <div className="w-4 h-4 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Simpan Semua Draft ({reports.filter(r => !r.isSaved).length})
              </button>
            </div>
          }
        />

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {message.type === "success" ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {/* Dashboard Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <User className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Terapis</p>
              <h4 className="text-lg font-black text-gray-900 mt-0.5">{reports.length} Pegawai</h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Rapor Tersimpan</p>
              <h4 className="text-lg font-black text-gray-900 mt-0.5">{reports.filter(r => r.isSaved).length} Terbit</h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Draft / Belum Disimpan</p>
              <h4 className="text-lg font-black text-gray-900 mt-0.5">{reports.filter(r => !r.isSaved).length} Draft</h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <DollarSign className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Estimasi Total Payroll</p>
              <h4 className="text-lg font-black text-gray-900 mt-0.5">{formatRupiah(reports.reduce((sum, r) => sum + r.takeHomePay, 0))}</h4>
            </div>
          </div>
        </div>

        {/* Main Grid List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Terapis</th>
                  <th className="px-6 py-4 font-bold text-center">Status Rapor</th>
                  <th className="px-6 py-4 font-bold text-center">Treatment</th>
                  <th className="px-6 py-4 font-bold text-center">Kehadiran (H / T / A)</th>
                  <th className="px-6 py-4 font-bold text-right">Gaji Pokok</th>
                  <th className="px-6 py-4 font-bold text-right">Komisi Tindakan</th>
                  <th className="px-6 py-4 font-bold text-right">Take-Home Pay (THP)</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi Distribusi & Rapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Mempersiapkan data rapor bulanan...
                      </div>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                      Tidak ada terapis aktif untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.therapistId} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div>{r.therapistName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">ID: {r.therapistId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.isSaved ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-green-50 text-green-700 border border-green-200">
                            Telah Terbit
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse">
                            Draft (Belum Simpan)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-800">
                        {r.totalTreatments} Pasien
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-sm text-gray-600">
                        <span className="text-green-600 font-bold">{r.attendancePresent}</span>
                        {" / "}
                        <span className="text-amber-500 font-bold">{r.attendanceLate}</span>
                        {" / "}
                        <span className="text-red-500 font-bold">{r.attendanceAbsent}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 font-medium">
                        {formatRupiah(r.baseSalary)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-semibold">
                        +{formatRupiah(r.commissions)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">
                        {formatRupiah(r.takeHomePay)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(r)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-100"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Kelola Rapor
                          </button>
                          
                          <button
                            disabled={!r.isSaved}
                            onClick={() => handleCopyLink(r.id)}
                            className="bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 px-2 py-1.5 rounded-lg border border-gray-200 transition-colors"
                            title="Salin Link Rapor Privat"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={!r.isSaved}
                            onClick={() => handleSendWA(r)}
                            className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-emerald-100 cursor-pointer"
                            title="Kirim slip gaji privat ke WhatsApp Terapis"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Kirim WA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Kelola Rapor */}
        {isModalOpen && activeReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-black text-gray-800">
                    Kelola Rapor & Gaji Bulanan
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Terapis: <span className="font-bold text-gray-700">{activeReport.therapistName}</span> | Periode: <span className="font-bold text-gray-700">{getMonthReadable(activeReport.month)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveReport} className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                  
                  {/* Row 1: Kuantitatif Performa */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" /> Modul 1: Metrik Performa & Kehadiran
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Total Tindakan</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={activeReport.totalTreatments}
                          onChange={e => handleModalInputChange("totalTreatments", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase text-green-600">Kehadiran (Hadir)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={activeReport.attendancePresent}
                          onChange={e => handleModalInputChange("attendancePresent", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-green-700 outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase text-amber-500">Terlambat</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={activeReport.attendanceLate}
                          onChange={e => handleModalInputChange("attendanceLate", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-amber-600 outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase text-red-500">Absen (Mangkir)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={activeReport.attendanceAbsent}
                          onChange={e => handleModalInputChange("attendanceAbsent", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-red-700 outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase text-purple-600">Sakit / Izin</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={activeReport.attendancePermit}
                          onChange={e => handleModalInputChange("attendancePermit", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-purple-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Keuangan / Slip Gaji */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Modul 2: Slip Gaji Komponen
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Gaji Pokok (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={activeReport.baseSalary}
                          onChange={e => handleModalInputChange("baseSalary", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Komisi Tindakan (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={activeReport.commissions}
                          onChange={e => handleModalInputChange("commissions", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tunjangan Makan / Transport (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={activeReport.allowances}
                          onChange={e => handleModalInputChange("allowances", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Bonus / Insentif Target (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={activeReport.bonuses}
                          onChange={e => handleModalInputChange("bonuses", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase text-red-500">Potongan / Kasbon / Denda (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={activeReport.deductions}
                          onChange={e => handleModalInputChange("deductions", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm font-semibold text-red-600 outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      
                      {/* Take-home Pay Display */}
                      <div className="space-y-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-3 sm:col-span-1 shadow-sm">
                        <label className="text-[9px] font-bold text-blue-100 uppercase tracking-wide">Net Take-Home Pay (THP)</label>
                        <div className="text-lg font-black mt-0.5">{formatRupiah(activeReport.takeHomePay)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Evaluasi Kualitatif & Rating */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" /> Modul 3: Evaluasi Kualitatif & Feedback
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Rating Kinerja:</label>
                        <input
                          type="text"
                          required
                          placeholder="Cth: 4.8"
                          value={activeReport.rating}
                          onChange={e => handleModalInputChange("rating", e.target.value)}
                          className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase">Kelebihan Bulan Ini (Apresiasi)</label>
                        <textarea
                          rows={2}
                          value={activeReport.notesStrengths}
                          onChange={e => handleModalInputChange("notesStrengths", e.target.value)}
                          placeholder="Tuliskan aspek positif kinerja terapis..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase">Area Perbaikan (Kritik / Catatan SOP)</label>
                        <textarea
                          rows={2}
                          value={activeReport.notesImprovements}
                          onChange={e => handleModalInputChange("notesImprovements", e.target.value)}
                          placeholder="Aspek standar pelayanan atau kedisiplinan yang perlu diperbaiki..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase">Target Bulan Depan</label>
                        <textarea
                          rows={2}
                          value={activeReport.notesTargets}
                          onChange={e => handleModalInputChange("notesTargets", e.target.value)}
                          placeholder="Instruksi spesifik target pencapaian bulan depan..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Menyimpan..." : "Simpan Laporan & Slip"}
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
