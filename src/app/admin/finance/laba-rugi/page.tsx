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
  //   Penyusutan Modal Investor  (input manual)
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
    ["Penyusutan Modal Investor", reportData.penyusutanModalInvestor],
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Laporan Laba Rugi"
          description="Laporan akuntansi standar untuk menganalisis keuntungan klinik."
          icon={FileText}
          rightContent={
            <div className="flex gap-3 flex-wrap items-center justify-end">
              {/* Filter Tahun */}
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700 font-medium text-sm transition-all cursor-pointer"
              >
                {[...Array(5)].map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>

              {/* Filter Bulan */}
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700 font-medium text-sm transition-all cursor-pointer"
              >
                <option value="ALL">Semua Bulan</option>
                {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => (
                  <option key={i + 1} value={String(i + 1)}>{m}</option>
                ))}
              </select>

              {/* Bagi Hasil Investor */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2">
                <span className="text-gray-700 text-sm font-medium">Bagi Hasil Investor:</span>
                <input
                  type="number" min="0" max="100"
                  value={investorPercentage}
                  onChange={e => setInvestorPercentage(Number(e.target.value))}
                  className="w-12 bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none text-gray-900 text-center text-sm font-bold"
                />
                <span className="text-gray-700 text-sm font-bold">%</span>
              </div>

              {/* Bagi Hasil Manajemen */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2">
                <span className="text-gray-700 text-sm font-medium">Bagi Hasil Manajemen:</span>
                <input
                  type="number" min="0" max="100"
                  value={managementPercentage}
                  onChange={e => setManagementPercentage(Number(e.target.value))}
                  className="w-12 bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none text-gray-900 text-center text-sm font-bold"
                />
                <span className="text-gray-700 text-sm font-bold">%</span>
              </div>

              {/* Penyusutan Modal Investor */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2">
                <span className="text-gray-700 text-sm font-medium">Penyusutan Modal Investor:</span>
                <span className="text-gray-900 text-sm font-bold">Rp</span>
                <input
                  type="number" min="0"
                  value={penyusutanModalInvestor}
                  onChange={e => setPenyusutanModalInvestor(Number(e.target.value))}
                  className="w-28 bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none text-gray-900 text-sm font-bold"
                />
              </div>

              {/* Export */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-white text-emerald-900 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" /> Export Laporan <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium flex items-center gap-2 border-b border-gray-50 transition-colors">
                      <FileIcon className="w-4 h-4" /> Export PDF
                    </button>
                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-emerald-600 font-medium flex items-center gap-2 border-b border-gray-50 transition-colors">
                      <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                    <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2 transition-colors">
                      <FileText className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          }
        />

        {loading ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl mt-8">Memuat laporan...</div>
        ) : (
          <div className="space-y-8 mt-8">

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100 shrink-0">
                  <TrendingUp className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Pendapatan</p>
                  <p className="text-2xl font-black text-gray-900">{formatRupiah(reportData.totalPendapatan)}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                  <DollarSign className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Biaya Usaha</p>
                  <p className="text-2xl font-black text-gray-900">{formatRupiah(reportData.totalBiayaUsaha)}</p>
                </div>
              </div>
              <div className={`bg-white p-6 rounded-3xl shadow-sm border flex items-center gap-5 ${reportData.labaRugi >= 0 ? "border-emerald-100" : "border-red-100"}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${reportData.labaRugi >= 0 ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                  {reportData.labaRugi >= 0
                    ? <TrendingUp className="w-8 h-8 text-emerald-600" />
                    : <TrendingDown className="w-8 h-8 text-red-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Laba Rugi</p>
                  <p className={`text-2xl font-black ${reportData.labaRugi >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {formatRupiah(reportData.labaRugi)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* ── Laporan Laba Rugi Table ── */}
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-lg text-gray-800">Laporan Laba Rugi</h3>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>

                      {/* ── PENDAPATAN USAHA ── */}
                      <tr>
                        <td colSpan={2} className="font-bold text-gray-900 pb-2 text-base">
                          PENDAPATAN USAHA
                        </td>
                      </tr>
                      {reportData.incomeItems.map(item => (
                        <tr key={item.name}>
                          <td className="py-2 pl-4 text-gray-600">{item.name}</td>
                          <td className="py-2 text-right font-medium text-gray-700">{formatRupiah(item.amount)}</td>
                        </tr>
                      ))}
                      {reportData.incomeItems.length === 0 && (
                        <tr>
                          <td className="py-2 pl-4 text-gray-400 italic text-xs">Tidak ada data</td>
                          <td className="py-2 text-right text-gray-400">{formatRupiah(0)}</td>
                        </tr>
                      )}
                      {/* TOTAL PENDAPATAN */}
                      <tr className="border-t-2 border-gray-300">
                        <td className="py-3 font-bold text-gray-900 text-base">TOTAL PENDAPATAN</td>
                        <td className="py-3 text-right font-bold text-teal-600 text-base">{formatRupiah(reportData.totalPendapatan)}</td>
                      </tr>

                      {/* ── BIAYA USAHA ── */}
                      <tr>
                        <td colSpan={2} className="font-bold text-gray-900 pt-6 pb-2 text-base">
                          BIAYA USAHA
                        </td>
                      </tr>
                      {reportData.biayaUsahaItems.map(item => (
                        <tr key={item.name}>
                          <td className="py-2 pl-4 text-gray-600">{item.name}</td>
                          <td className="py-2 text-right font-medium text-gray-700">{formatRupiah(item.amount)}</td>
                        </tr>
                      ))}
                      {reportData.biayaUsahaItems.length === 0 && (
                        <tr>
                          <td className="py-2 pl-4 text-gray-400 italic text-xs">Tidak ada data</td>
                          <td className="py-2 text-right text-gray-400">{formatRupiah(0)}</td>
                        </tr>
                      )}
                      {/* TOTAL BIAYA USAHA */}
                      <tr className="border-t-2 border-gray-300">
                        <td className="py-3 font-bold text-gray-900 text-base">TOTAL BIAYA USAHA</td>
                        <td className="py-3 text-right font-bold text-red-500 text-base">{formatRupiah(reportData.totalBiayaUsaha)}</td>
                      </tr>

                      {/* ── LABA RUGI ── */}
                      <tr className={reportData.labaRugi >= 0 ? "bg-emerald-50" : "bg-red-50"}>
                        <td className="py-4 px-4 font-black text-gray-900 text-lg rounded-l-lg">LABA RUGI</td>
                        <td className={`py-4 px-4 text-right font-black text-lg rounded-r-lg ${reportData.labaRugi >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {formatRupiah(reportData.labaRugi)}
                        </td>
                      </tr>

                      {/* ── Distribusi (kotak kuning seperti foto) ── */}
                      {/* Spacer */}
                      <tr><td colSpan={2} className="pt-4" /></tr>

                      {/* Penyusutan Modal Investor */}
                      <tr className="bg-yellow-50 border border-yellow-300">
                        <td className="py-3 px-4 font-bold text-gray-800">Penyusutan Modal Investor</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                          {formatRupiah(reportData.penyusutanModalInvestor)}
                        </td>
                      </tr>

                      {/* Infaq 2.5% */}
                      <tr className="bg-yellow-50 border border-yellow-300">
                        <td className="py-3 px-4 font-bold text-gray-800">Infaq (2.5%)</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                          {formatRupiah(reportData.infaqShare)}
                        </td>
                      </tr>

                      {/* Bagi Hasil Investor */}
                      <tr className="bg-yellow-50 border border-yellow-300">
                        <td className="py-3 px-4 font-bold text-gray-800">
                          Bagi Hasil Investor ({reportData.investorPercentage}%)
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                          {formatRupiah(reportData.investorShare)}
                        </td>
                      </tr>

                      {/* Bagi Hasil Manajemen */}
                      <tr className="bg-yellow-50 border border-yellow-300">
                        <td className="py-3 px-4 font-bold text-gray-800">
                          Bagi Hasil Manajemen ({reportData.managementPercentage}%)
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                          {formatRupiah(reportData.managementShare)}
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Grafik Analitik Bulanan ── */}
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-lg text-gray-800">Analitik Laba Rugi {selectedYear}</h3>
                </div>
                <div className="p-6 flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis
                        tickFormatter={val => `Rp${(val / 1000000).toFixed(0)}M`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(value))
                        }
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Legend />
                      <Bar dataKey="Pendapatan" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="BiayaUsaha" name="Biaya Usaha" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="LabaRugi" name="Laba Rugi" fill="#10b981" radius={[4, 4, 0, 0]} />
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
