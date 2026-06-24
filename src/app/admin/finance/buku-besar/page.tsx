"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Download, BookOpen, Printer, ChevronDown, FileSpreadsheet, File as FileIcon } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageHeader from "@/components/layout/PageHeader";

type FinanceTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  referenceId: string | null;
  branchId: string | null;
  paymentMethod: string;
  date: string;
};

type Branch = { id: string; name: string };

// Format angka tanpa simbol Rp, dengan titik ribuan (sesuai foto)
const fmtNum = (val: number) =>
  val === 0 ? "0" : new Intl.NumberFormat("id-ID").format(val);

// Format tanggal: "25-May-26"
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Agt","Sep","Oct","Nov","Dec"];
  const yy = String(d.getFullYear()).slice(-2);
  return `${String(d.getDate()).padStart(2,"0")}-${months[d.getMonth()]}-${yy}`;
};

export default function BukuBesarPage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterBranch, setFilterBranch] = useState("");
  const [dateFilter, setDateFilter] = useState("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Export dropdown
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Click-outside untuk dropdown export
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setIsExportOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hitung range tanggal
  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    if (dateFilter === "today") {
      const d = today.toISOString().split("T")[0];
      return { startDate: d, endDate: d };
    }
    if (dateFilter === "thisWeek") {
      const day = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - day + 1);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { startDate: mon.toISOString().split("T")[0], endDate: sun.toISOString().split("T")[0] };
    }
    if (dateFilter === "thisMonth") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { startDate: first.toISOString().split("T")[0], endDate: last.toISOString().split("T")[0] };
    }
    if (dateFilter === "lastMonth") {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last  = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: first.toISOString().split("T")[0], endDate: last.toISOString().split("T")[0] };
    }
    if (dateFilter === "thisYear") {
      const first = new Date(today.getFullYear(), 0, 1);
      const last  = new Date(today.getFullYear(), 11, 31);
      return { startDate: first.toISOString().split("T")[0], endDate: last.toISOString().split("T")[0] };
    }
    if (dateFilter === "custom") {
      return { startDate: customStart, endDate: customEnd };
    }
    return { startDate: "", endDate: "" };
  };

  const periodLabel = () => {
    const { startDate, endDate } = getDateRange();
    if (!startDate && !endDate) return "Semua Periode";
    const fmt = (s: string) => {
      if (!s) return "";
      const d = new Date(s);
      const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };
    return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} - ${fmt(endDate)}`;
  };

  // Fetch cabang
  useEffect(() => {
    fetch("/api/branches")
      .then(r => r.json())
      .then(j => setBranches(j.data || []))
      .catch(console.error);
  }, []);

  // Fetch transaksi
  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams();
      if (filterBranch) params.append("branch", filterBranch);
      if (startDate)    params.append("startDate", startDate);
      if (endDate)      params.append("endDate", endDate);
      const res = await fetch(`/api/finance?${params}`);
      if (res.ok) {
        const all: FinanceTransaction[] = await res.json();
        // Hanya EXPENSE, urutkan tanggal ASC
        const expenses = all
          .filter(t => t.type === "EXPENSE")
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setTransactions(expenses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter === "custom" && (!customStart || !customEnd)) return;
    fetchData();
  }, [filterBranch, dateFilter, customStart, customEnd]);

  // Kelompokkan per kategori (urutan sesuai kemunculan pertama)
  const grouped = useMemo(() => {
    const map = new Map<string, FinanceTransaction[]>();
    transactions.forEach(t => {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    });
    return map;
  }, [transactions]);

  const branchName = filterBranch
    ? branches.find(b => b.id === filterBranch)?.name ?? filterBranch
    : "Semua Cabang";

  // ── Export helpers ─────────────────────────────────────────────────────────
  const buildExportRows = () => {
    const rows: (string | number)[][] = [
      ["LAPORAN BUKU BESAR"],
      ["Cabang:", branchName],
      ["Periode:", periodLabel()],
      [""],
    ];
    grouped.forEach((items, cat) => {
      rows.push([cat]);
      rows.push(["TANGGAL", "KETERANGAN", "DEBIT", "KREDIT"]);
      items.forEach(t => {
        rows.push([fmtDate(t.date), t.description, t.amount, 0]);
      });
      const jumlah = items.reduce((s, t) => s + t.amount, 0);
      rows.push(["", "Jumlah", jumlah, 0]);
      rows.push([""]);
    });
    return rows;
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(buildExportRows());
    XLSX.utils.book_append_sheet(wb, ws, "Buku Besar");
    XLSX.writeFile(wb, `Buku_Besar_${Date.now()}.xlsx`);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN BUKU BESAR", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Cabang: ${branchName}`, 105, 22, { align: "center" });
    doc.text(`Periode: ${periodLabel()}`, 105, 28, { align: "center" });

    let y = 36;

    grouped.forEach((items, cat) => {
      // Category label
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(255, 255, 0);
      doc.rect(14, y, 182, 7, "F");
      doc.setTextColor(0, 0, 0);
      doc.text(cat, 15, y + 5);
      y += 9;

      const tableRows = items.map(t => [fmtDate(t.date), t.description, fmtNum(t.amount), "0"]);
      const jumlah = items.reduce((s, t) => s + t.amount, 0);
      tableRows.push(["", "Jumlah", fmtNum(jumlah), "0"]);

      autoTable(doc, {
        startY: y,
        head: [["TANGGAL", "KETERANGAN", "DEBIT", "KREDIT"]],
        body: tableRows,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: 100 },
          2: { cellWidth: 28, halign: "right" },
          3: { cellWidth: 22, halign: "right" },
        },
        didDrawPage: (d) => { y = (d.cursor?.y ?? y) + 4; },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
      if (y > 265) { doc.addPage(); y = 15; }
    });

    doc.save(`Buku_Besar_${Date.now()}.pdf`);
    setIsExportOpen(false);
  };

  const handlePrint = () => window.print();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Buku Besar"
          description="Rincian transaksi pengeluaran per kategori secara detail."
          icon={BookOpen}
          rightContent={
            <div className="flex flex-wrap items-center gap-3">
              {/* Cabang */}
              <select
                value={filterBranch}
                onChange={e => setFilterBranch(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl text-gray-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              >
                <option value="">Semua Cabang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              {/* Periode */}
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl text-gray-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              >
                <option value="today">Hari Ini</option>
                <option value="thisWeek">Minggu Ini</option>
                <option value="thisMonth">Bulan Ini</option>
                <option value="lastMonth">Bulan Lalu</option>
                <option value="thisYear">Tahun Ini</option>
                <option value="custom">Kustom</option>
              </select>

              {dateFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm" />
                  <span className="text-gray-400 font-bold">—</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm" />
                </div>
              )}

              {/* Print */}
              <button
                onClick={handlePrint}
                className="bg-white border border-gray-200 shadow-sm hover:bg-gray-50 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-gray-700 text-sm transition-all print:hidden"
              >
                <Printer className="w-4 h-4" /> Print
              </button>

              {/* Export dropdown */}
              <div className="relative print:hidden" ref={exportRef}>
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="bg-white border border-gray-200 shadow-sm hover:bg-gray-50 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-gray-700 text-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isExportOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <button onClick={handleExportPDF}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium flex items-center gap-2 border-b border-gray-50 transition-colors text-sm">
                      <FileIcon className="w-4 h-4" /> Export PDF
                    </button>
                    <button onClick={handleExportExcel}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-emerald-600 font-medium flex items-center gap-2 transition-colors text-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          }
        />

        {/* ── AREA CETAK ── */}
        <div className="mt-8 space-y-2" id="print-area">

          {/* Header Laporan (terlihat saat print) */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-xl font-black underline">LAPORAN BUKU BESAR</h1>
            <p className="font-bold">{branchName}</p>
            <p className="font-semibold">PERIODE {periodLabel().toUpperCase()}</p>
          </div>

          {/* Info periode (layar) */}
          <div className="print:hidden bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-yellow-800">
              📒 Buku Besar · {branchName} · {periodLabel()}
            </span>
            <span className="text-sm text-yellow-700 font-medium">
              {transactions.length} transaksi · {grouped.size} kategori
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat data...
            </div>
          ) : grouped.size === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100">
              Tidak ada data pengeluaran di periode ini.
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(grouped.entries()).map(([category, items]) => {
                const jumlah = items.reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={category} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm print:rounded-none print:shadow-none print:border-0 print:break-inside-avoid">
                    {/* Kategori header (kuning seperti foto) */}
                    <div className="bg-yellow-300 px-4 py-2 print:bg-yellow-200">
                      <span className="font-bold text-gray-900 text-sm">{category}</span>
                    </div>

                    {/* Tabel */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300 w-28">TANGGAL</th>
                            <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300">KETERANGAN</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300 w-36">DEBIT</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300 w-28">KREDIT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((t, idx) => (
                            <tr
                              key={t.id}
                              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                            >
                              <td className="px-4 py-2 border border-gray-200 text-gray-700 whitespace-nowrap font-mono text-xs">
                                {fmtDate(t.date)}
                              </td>
                              <td className="px-4 py-2 border border-gray-200 text-gray-800">
                                {t.description}
                              </td>
                              <td className="px-4 py-2 border border-gray-200 text-right text-gray-900 font-medium">
                                {fmtNum(t.amount)}
                              </td>
                              <td className="px-4 py-2 border border-gray-200 text-right text-gray-500">
                                0
                              </td>
                            </tr>
                          ))}

                          {/* Baris kosong sebelum Jumlah (sesuai foto) */}
                          <tr>
                            <td className="border border-gray-200 px-4 py-1" />
                            <td className="border border-gray-200 px-4 py-1" />
                            <td className="border border-gray-200 px-4 py-1" />
                            <td className="border border-gray-200 px-4 py-1" />
                          </tr>

                          {/* Baris Jumlah */}
                          <tr className="bg-yellow-50 font-bold">
                            <td className="border border-gray-300 px-4 py-2" />
                            <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">Jumlah</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-gray-900">
                              {fmtNum(jumlah)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-gray-500">0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* TOTAL SEMUA KATEGORI */}
              <div className="bg-gray-900 text-white rounded-2xl px-6 py-4 flex justify-between items-center print:bg-gray-800">
                <span className="font-black text-lg">TOTAL SELURUH BIAYA USAHA</span>
                <span className="font-black text-xl tabular-nums">
                  {fmtNum(transactions.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
