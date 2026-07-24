"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Download, FileText, TrendingUp, DollarSign,
  FileSpreadsheet, File as FileIcon, ChevronDown, TrendingDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageHeader from "@/components/layout/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type FinanceTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
};

export default function AdminLabaRugiPage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [investorPercentage, setInvestorPercentage] = useState<number>(0);
  const [managementPercentage, setManagementPercentage] = useState<number>(0);
  const [penyusutanModalInvestor, setPenyusutanModalInvestor] = useState<number>(0);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance?startDate=${selectedYear}-01-01&endDate=${selectedYear}-12-31`);
      if (res.ok) setTransactions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedYear]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "ALL") return transactions;
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === parseInt(selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // ──────────────────────────────────────────────────────────────────────────
  // LOGIKA SESUAI FOTO:
  //   PENDAPATAN USAHA
  //   ─ item pemasukan
  //   TOTAL PENDAPATAN
  //
  //   BIAYA USAHA  ← SEMUA pengeluaran masuk sini, flat, tanpa sub-kategori
  //   ─ item pengeluaran (per kategori)
  //   TOTAL BIAYA USAHA
  //
  //   LABA RUGI = TOTAL PENDAPATAN − TOTAL BIAYA USAHA
  //
  //   Penyusutan Sewa Ruko  (input manual)
  //   Infaq (2.5%)               = LABA RUGI × 2.5%
  //   Bagi Hasil Investor (x%)   = LABA RUGI × x%
  //   Bagi Hasil Manajemen (x%)  = LABA RUGI × x%
  // ──────────────────────────────────────────────────────────────────────────
  const reportData = useMemo(() => {
    let incomeCategories: Record<string, number> = {};
    let expenseCategories: Record<string, number> = {};
    let totalPendapatan = 0;
    let totalBiayaUsaha = 0;

    filteredTransactions.forEach(t => {
      if (t.type === "INCOME") {
        totalPendapatan += t.amount;
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
      } else {
        totalBiayaUsaha += t.amount;
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
      }
    });

    // Semua pengeluaran jadi satu list flat (BIAYA USAHA)
    const biayaUsahaItems: { name: string; amount: number }[] = Object.entries(expenseCategories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); // urutkan terbesar dulu

    const labaRugi = totalPendapatan - totalBiayaUsaha;

    // Distribusi dari Laba Rugi (bisa negatif → tidak dibagi)
    const infaqShare = labaRugi > 0 ? labaRugi * 0.025 : 0;
    const investorShare = labaRugi > 0 ? labaRugi * (investorPercentage / 100) : 0;
    const managementShare = labaRugi > 0 ? labaRugi * (managementPercentage / 100) : 0;

    return {
      incomeItems: Object.entries(incomeCategories)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      totalPendapatan,
      biayaUsahaItems,
      totalBiayaUsaha,
      labaRugi,
      // distribusi
      penyusutanModalInvestor,
      infaqShare,
      investorShare,
      managementShare,
      investorPercentage,
      managementPercentage,
    };
  }, [filteredTransactions, investorPercentage, managementPercentage, penyusutanModalInvestor]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const data = months.map(m => ({ name: m, Pendapatan: 0, BiayaUsaha: 0, LabaRugi: 0 }));

    transactions.forEach(t => {
      const mIdx = new Date(t.date).getMonth();
      if (t.type === "INCOME") {
        data[mIdx].Pendapatan += t.amount;
      } else {
        data[mIdx].BiayaUsaha += t.amount;
      }
    });

    data.forEach(d => {
      d.LabaRugi = d.Pendapatan - d.BiayaUsaha;
    });

    return data;
  }, [transactions]);

  // ── Export ────────────────────────────────────────────────────────────────
  const getExportData = () => [
    ["Laporan Laba Rugi"],
    [`Tahun: ${selectedYear}`, `Bulan: ${selectedMonth === "ALL" ? "Semua Bulan" : selectedMonth}`],
    [""],
    ["Keterangan", "Nominal"],
    ["PENDAPATAN USAHA", ""],
    ...reportData.incomeItems.map(i => [`  ${i.name}`, i.amount]),
    ["TOTAL PENDAPATAN", reportData.totalPendapatan],
    [""],
    ["BIAYA USAHA", ""],
    ...reportData.biayaUsahaItems.map(i => [`  ${i.name}`, i.amount]),
    ["TOTAL BIAYA USAHA", reportData.totalBiayaUsaha],
    [""],
    ["LABA RUGI", reportData.labaRugi],
    [""],
    ["Penyusutan Sewa Ruko", reportData.penyusutanModalInvestor],
    [`Infaq (2.5%)`, reportData.infaqShare],
    [`Bagi Hasil Investor (${reportData.investorPercentage}%)`, reportData.investorShare],
    [`Bagi Hasil Manajemen (${reportData.managementPercentage}%)`, reportData.managementShare],
  ];

  const handleExportCSV = () => {
    const csvData = getExportData().map(row => row.join(",")).join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laba_Rugi_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(getExportData());
    XLSX.utils.book_append_sheet(wb, ws, "Laba Rugi");
    XLSX.writeFile(wb, `Laba_Rugi_${selectedYear}_${selectedMonth}.xlsx`);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Laporan Laba Rugi", 14, 20);
    doc.setFontSize(11);
    doc.text(`Tahun: ${selectedYear} | Bulan: ${selectedMonth === "ALL" ? "Semua Bulan" : selectedMonth}`, 14, 28);

    const rows = getExportData().slice(4);
    const tableBody = rows
      .map(row => {
        if (row.length === 1 || row[0] === "") return null;
        const isHeaderRow = !(row[0] as string).startsWith("  ") && row[1] === "";
        return [
          { content: (row[0] as string).trim(), styles: { fontStyle: isHeaderRow ? "bold" : "normal", halign: "left" } },
          { content: row[1] !== "" ? formatRupiah(row[1] as number) : "", styles: { fontStyle: isHeaderRow ? "bold" : "normal", halign: "right" } },
        ];
      })
      .filter(Boolean);

    autoTable(doc, {
      startY: 35,
      head: [["Keterangan", "Nominal"]],
      body: tableBody as any,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
    });

    doc.save(`Laba_Rugi_${selectedYear}_${selectedMonth}.pdf`);
    setIsExportMenuOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <PageHeader
          title="Laporan Laba Rugi"
          description="Laporan akuntansi modern untuk menganalisis keuntungan klinik secara komprehensif."
          icon={FileText}
          rightContent={
            <div className="flex gap-3 flex-wrap items-center justify-end">
              {/* Filter Tahun */}
              <div className="relative group">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="pl-4 pr-10 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700 font-bold text-sm transition-all cursor-pointer appearance-none hover:border-emerald-300"
                >
                  {[...Array(5)].map((_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
              </div>

              {/* Filter Bulan */}
              <div className="relative group">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700 font-bold text-sm transition-all cursor-pointer appearance-none hover:border-emerald-300"
                >
                  <option value="ALL">Semua Bulan</option>
                  {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => (
                    <option key={i + 1} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
              </div>

              {/* Bagi Hasil Investor */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-xl px-4 py-2 hover:border-emerald-200 transition-colors">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Bagi Hasil Inv:</span>
                <input
                  type="number" min="0" max="100"
                  value={investorPercentage}
                  onChange={e => setInvestorPercentage(Number(e.target.value))}
                  className="w-10 bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none text-emerald-700 text-center text-sm font-black transition-colors"
                />
                <span className="text-emerald-600 text-sm font-black">%</span>
              </div>

              {/* Bagi Hasil Manajemen */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-xl px-4 py-2 hover:border-emerald-200 transition-colors">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Bagi Hasil Mgt:</span>
                <input
                  type="number" min="0" max="100"
                  value={managementPercentage}
                  onChange={e => setManagementPercentage(Number(e.target.value))}
                  className="w-10 bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none text-emerald-700 text-center text-sm font-black transition-colors"
                />
                <span className="text-emerald-600 text-sm font-black">%</span>
              </div>

              {/* Penyusutan Sewa Ruko */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-xl px-4 py-2 hover:border-emerald-200 transition-colors">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Penyusutan Sewa Ruko:</span>
                <span className="text-gray-400 text-sm font-bold">Rp</span>
                <input
                  type="number" min="0"
                  value={penyusutanModalInvestor || ""}
                  onChange={e => setPenyusutanModalInvestor(Number(e.target.value))}
                  className="w-24 bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none text-gray-800 text-sm font-black transition-colors placeholder:text-gray-300"
                  placeholder="0"
                />
              </div>

              {/* Export */}
              <div className="relative ml-auto" ref={dropdownRef}>
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" /> Export Laporan <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.15)] border border-gray-100/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 space-y-1">
                      <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-600 font-semibold flex items-center gap-3 transition-colors">
                        <div className="bg-red-100 p-1.5 rounded-lg"><FileIcon className="w-4 h-4 text-red-500" /></div> Export PDF
                      </button>
                      <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-gray-600 font-semibold flex items-center gap-3 transition-colors">
                        <div className="bg-emerald-100 p-1.5 rounded-lg"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /></div> Export Excel
                      </button>
                      <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 hover:text-gray-800 text-gray-600 font-semibold flex items-center gap-3 transition-colors">
                        <div className="bg-gray-200 p-1.5 rounded-lg"><FileText className="w-4 h-4 text-gray-600" /></div> Export CSV
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-md rounded-3xl mt-8 border border-white/50">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <p className="mt-4 font-semibold text-emerald-800">Menyiapkan Laporan...</p>
          </div>
        ) : (
          <div className="space-y-8 mt-8">

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(20,184,166,0.12)] transition-all duration-300 flex items-center gap-5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0 relative z-10">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Pendapatan</p>
                  <p className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-600 tracking-tight">{formatRupiah(reportData.totalPendapatan)}</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(244,63,94,0.12)] transition-all duration-300 flex items-center gap-5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0 relative z-10">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Biaya Usaha</p>
                  <p className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-600 tracking-tight">{formatRupiah(reportData.totalBiayaUsaha)}</p>
                </div>
              </div>
              <div className={`bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-5 group relative overflow-hidden ${reportData.labaRugi >= 0 ? "hover:shadow-[0_20px_40px_rgb(16,185,129,0.15)]" : "hover:shadow-[0_20px_40px_rgb(244,63,94,0.15)]"}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500 ${reportData.labaRugi >= 0 ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5" : "bg-gradient-to-br from-rose-500/10 to-red-500/5"}`}></div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0 relative z-10 ${reportData.labaRugi >= 0 ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/30" : "bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-500/30"}`}>
                  {reportData.labaRugi >= 0
                    ? <TrendingUp className="w-7 h-7 text-white" />
                    : <TrendingDown className="w-7 h-7 text-white" />}
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Laba Rugi</p>
                  <p className={`text-3xl lg:text-4xl font-black text-transparent bg-clip-text tracking-tight ${reportData.labaRugi >= 0 ? "bg-gradient-to-r from-emerald-600 to-green-600" : "bg-gradient-to-r from-rose-600 to-red-600"}`}>
                    {formatRupiah(reportData.labaRugi)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* ── Laporan Laba Rugi Table ── */}
              <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                <div className="p-6 lg:p-8 border-b border-gray-100/50 bg-gradient-to-r from-emerald-50/30 to-transparent">
                  <h3 className="font-black text-xl text-gray-800 flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl"><FileText className="w-5 h-5 text-emerald-600" /></div>
                    Rincian Laba Rugi
                  </h3>
                </div>
                <div className="p-6 lg:p-8 overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <tbody>
                      {/* ── PENDAPATAN USAHA ── */}
                      <tr>
                        <td colSpan={2} className="font-black text-emerald-800 pb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Pendapatan Usaha
                        </td>
                      </tr>
                      {reportData.incomeItems.map(item => (
                        <tr key={item.name} className="group">
                          <td className="py-3 px-4 text-gray-600 font-medium group-hover:bg-emerald-50/50 rounded-l-xl transition-colors">{item.name}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-800 group-hover:bg-emerald-50/50 rounded-r-xl transition-colors">{formatRupiah(item.amount)}</td>
                        </tr>
                      ))}
                      {reportData.incomeItems.length === 0 && (
                        <tr>
                          <td className="py-3 px-4 text-gray-400 italic text-sm">Tidak ada data pendapatan</td>
                          <td className="py-3 px-4 text-right text-gray-400">{formatRupiah(0)}</td>
                        </tr>
                      )}
                      {/* TOTAL PENDAPATAN */}
                      <tr><td colSpan={2} className="py-1"></td></tr>
                      <tr className="bg-emerald-50/80 rounded-2xl">
                        <td className="py-4 px-5 font-black text-emerald-900 text-sm uppercase tracking-wider rounded-l-2xl border-l-4 border-emerald-500">TOTAL PENDAPATAN</td>
                        <td className="py-4 px-5 text-right font-black text-emerald-700 text-lg rounded-r-2xl">{formatRupiah(reportData.totalPendapatan)}</td>
                      </tr>

                      {/* ── BIAYA USAHA ── */}
                      <tr>
                        <td colSpan={2} className="font-black text-rose-800 pt-8 pb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div> Biaya Usaha
                        </td>
                      </tr>
                      {reportData.biayaUsahaItems.map(item => (
                        <tr key={item.name} className="group">
                          <td className="py-3 px-4 text-gray-600 font-medium group-hover:bg-rose-50/50 rounded-l-xl transition-colors">{item.name}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-800 group-hover:bg-rose-50/50 rounded-r-xl transition-colors">{formatRupiah(item.amount)}</td>
                        </tr>
                      ))}
                      {reportData.biayaUsahaItems.length === 0 && (
                        <tr>
                          <td className="py-3 px-4 text-gray-400 italic text-sm">Tidak ada data biaya</td>
                          <td className="py-3 px-4 text-right text-gray-400">{formatRupiah(0)}</td>
                        </tr>
                      )}
                      {/* TOTAL BIAYA USAHA */}
                      <tr><td colSpan={2} className="py-1"></td></tr>
                      <tr className="bg-rose-50/80 rounded-2xl">
                        <td className="py-4 px-5 font-black text-rose-900 text-sm uppercase tracking-wider rounded-l-2xl border-l-4 border-rose-500">TOTAL BIAYA USAHA</td>
                        <td className="py-4 px-5 text-right font-black text-rose-700 text-lg rounded-r-2xl">{formatRupiah(reportData.totalBiayaUsaha)}</td>
                      </tr>

                      {/* ── LABA RUGI BERSIN ── */}
                      <tr><td colSpan={2} className="pt-8"></td></tr>
                      <tr>
                        <td colSpan={2}>
                          <div className={`p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${reportData.labaRugi >= 0 ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400 shadow-xl shadow-emerald-500/20" : "bg-gradient-to-r from-rose-500 to-red-600 border-rose-400 shadow-xl shadow-rose-500/20"}`}>
                            <span className="font-black text-white/90 text-sm tracking-widest uppercase flex items-center gap-2">
                              {reportData.labaRugi >= 0 ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                              Laba Rugi Bersih
                            </span>
                            <span className="font-black text-white text-3xl sm:text-4xl tracking-tight">{formatRupiah(reportData.labaRugi)}</span>
                          </div>
                        </td>
                      </tr>

                      {/* ── Distribusi ── */}
                      <tr>
                        <td colSpan={2} className="pt-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                               <p className="text-xs font-extrabold text-amber-700/80 uppercase tracking-widest mb-1.5">Penyusutan Sewa Ruko</p>
                               <p className="text-xl font-black text-amber-900">{formatRupiah(reportData.penyusutanModalInvestor)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                               <p className="text-xs font-extrabold text-emerald-700/80 uppercase tracking-widest mb-1.5">Infaq (2.5%)</p>
                               <p className="text-xl font-black text-emerald-900">{formatRupiah(reportData.infaqShare)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                               <p className="text-xs font-extrabold text-blue-700/80 uppercase tracking-widest mb-1.5">Bagi Hasil Inv ({reportData.investorPercentage}%)</p>
                               <p className="text-xl font-black text-blue-900">{formatRupiah(reportData.investorShare)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/50 p-5 rounded-2xl border border-purple-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                               <p className="text-xs font-extrabold text-purple-700/80 uppercase tracking-widest mb-1.5">Bagi Hasil Mgt ({reportData.managementPercentage}%)</p>
                               <p className="text-xl font-black text-purple-900">{formatRupiah(reportData.managementShare)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Grafik Analitik Bulanan ── */}
              <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                <div className="p-6 lg:p-8 border-b border-gray-100/50 bg-gradient-to-r from-indigo-50/30 to-transparent">
                  <h3 className="font-black text-xl text-gray-800 flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
                    Analitik Laba Rugi {selectedYear}
                  </h3>
                </div>
                <div className="p-6 lg:p-8 flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                      <YAxis
                        tickFormatter={val => `Rp${(val / 1000000).toFixed(0)}M`}
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}}
                        dx={-10}
                      />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(value))
                        }
                        cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                      <Bar dataKey="Pendapatan" fill="url(#colorPendapatan)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="BiayaUsaha" name="Biaya Usaha" fill="url(#colorBiaya)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="LabaRugi" name="Laba Rugi" fill="url(#colorLaba)" radius={[6, 6, 0, 0]} />
                      
                      {/* Define Gradients for Bars */}
                      <defs>
                        <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="colorBiaya" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
