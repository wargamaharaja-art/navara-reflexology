"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, Download, Settings, X, Link as LinkIcon, BookOpen, Users, FileText, FileSpreadsheet, File as FileIcon, Tag, Percent, Receipt, ChevronRight, Eye, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "@/components/ui/Pagination";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DiscountInvoice = {
  id: string;
  invoiceNumber: string;
  patientName: string;
  branchName: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  createdAt: string;
};

type DiscountSummary = {
  totalSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalGrandTotal: number;
  totalInvoices: number;
  discountedInvoicesCount: number;
  discountPercentage: number;
  discountedInvoiceRate: number;
  discountedInvoices: DiscountInvoice[];
};

type FinanceTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  referenceId: string | null;
  branchId: string | null;
  paymentMethod: string;
  attachmentUrl: string | null;
  date: string;
};

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AdminFinancePage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [discountSummary, setDiscountSummary] = useState<DiscountSummary | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    type: "INCOME" as "INCOME" | "EXPENSE",
    category: "",
    amount: 0 as number | string,
    description: "",
    branchId: "",
    serviceId: "",
    paymentMethod: "CASH",
    attachmentUrl: "",
  });

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  const paymentMethods = ["CASH", "DEBIT", "TRANSFER BANK"];

  const incomeCategories = useMemo(() => Array.from(new Set(categories.filter((c: Category) => c.type === "INCOME").map((c: Category) => c.name))), [categories]);
  const expenseCategories = useMemo(() => Array.from(new Set(categories.filter((c: Category) => c.type === "EXPENSE").map((c: Category) => c.name))), [categories]);

  // Set default category when type changes
  useEffect(() => {
    if (formData.type === "INCOME" && incomeCategories.length > 0 && !incomeCategories.includes(formData.category)) {
      setFormData((prev: typeof formData) => ({ ...prev, category: incomeCategories[0] }));
    } else if (formData.type === "EXPENSE" && expenseCategories.length > 0 && !expenseCategories.includes(formData.category)) {
      setFormData((prev: typeof formData) => ({ ...prev, category: expenseCategories[0] }));
    }
  }, [formData.type, incomeCategories, expenseCategories]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/finance?${params.toString()}`);
      if (res.ok) setTransactions(await res.json());
    } catch (err) {
      console.error("Failed to fetch finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/finance/discount-summary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDiscountSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch discount summary:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/finance/categories");
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          // If no categories, create defaults
          const defaults = [
            { name: "Reservasi", type: "INCOME" },
            { name: "Penjualan Herbal", type: "INCOME" },
            { name: "Lain-lain", type: "INCOME" },
            { name: "biaya adm bank(ketika transfer beda bank)", type: "EXPENSE" },
            { name: "biaya alat medis", type: "EXPENSE" },
            { name: "biaya desain grafis", type: "EXPENSE" },
            { name: "biaya gaji karyawan", type: "EXPENSE" },
            { name: "biaya internet", type: "EXPENSE" },
            { name: "biaya lain-lain", type: "EXPENSE" },
            { name: "biaya lembur terapis", type: "EXPENSE" },
            { name: "biaya listrik", type: "EXPENSE" },
            { name: "biaya marketing dan pemasaran", type: "EXPENSE" },
            { name: "biaya operasional", type: "EXPENSE" },
            { name: "biaya pemeliharaan", type: "EXPENSE" },
            { name: "biaya subsidi kontrakan karyawan", type: "EXPENSE" },
            { name: "biaya transportasi", type: "EXPENSE" },
            { name: "biaya uang makan karyawan", type: "EXPENSE" },
            { name: "gaji bagian administrasi", type: "EXPENSE" },
            { name: "gaji kepala cabang", type: "EXPENSE" },
            { name: "Bagi Hasil Terapis", type: "EXPENSE" },
          ];
          for (const d of defaults) {
            await fetch("/api/finance/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(d),
            });
          }
          const res2 = await fetch("/api/finance/categories");
          setCategories(await res2.json());
        } else {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const json = await res.json();
      if (res.ok) setBranches(json.data || []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    };
    fetchSession();
    fetchCategories();
    fetchBranches();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // reset pagination when filters change
    fetchTransactions();
    fetchDiscountSummary();
  }, [startDate, endDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan kas ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await fetch(`/api/finance/${id}`, { method: "DELETE" });
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setIsFormOpen(false);
      setFormData({ type: "INCOME", category: incomeCategories[0] || "", amount: 0, description: "", branchId: "", serviceId: "", paymentMethod: "CASH", attachmentUrl: "" });
      fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, type: newCategoryType }),
      });
      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return alert("Tidak ada data untuk diekspor");

    const headers = ["Tanggal", "Waktu", "Tipe", "Kategori", "Metode Pembayaran", "Deskripsi", "Cabang", "Nominal", "Referensi", "Attachment"];
    const csvRows = [headers.join(",")];

    transactions.forEach((t: FinanceTransaction) => {
      const dateObj = new Date(t.date);
      const dateStr = dateObj.toLocaleDateString('id-ID');
      const timeStr = dateObj.toLocaleTimeString('id-ID');

      const row = [
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${t.type}"`,
        `"${t.category}"`,
        `"${t.paymentMethod}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.branchId ? branches.find((b: any) => b.id === t.branchId)?.name || t.branchId : "Pusat"}"`,
        t.amount,
        `"${t.referenceId || ""}"`,
        `"${t.attachmentUrl || ""}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `laporan_keuangan_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) return alert("Tidak ada data untuk diekspor");

    const exportData = transactions.map((t: FinanceTransaction) => {
      const dateObj = new Date(t.date);
      return {
        Tanggal: dateObj.toLocaleDateString('id-ID'),
        Waktu: dateObj.toLocaleTimeString('id-ID'),
        Tipe: t.type,
        Kategori: t.category,
        "Metode Pembayaran": t.paymentMethod,
        Deskripsi: t.description,
        Cabang: t.branchId ? branches.find((b: any) => b.id === t.branchId)?.name || t.branchId : "Pusat",
        Nominal: t.amount,
        Referensi: t.referenceId || "",
        Attachment: t.attachmentUrl || ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    XLSX.writeFile(workbook, `laporan_keuangan_${new Date().getTime()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) return alert("Tidak ada data untuk diekspor");

    const doc = new jsPDF();
    doc.text("Laporan Keuangan", 14, 15);

    const tableColumn = ["Tanggal", "Waktu", "Tipe", "Kategori", "Metode", "Cabang", "Nominal"];
    const tableRows: any[] = [];

    transactions.forEach((t: FinanceTransaction) => {
      const dateObj = new Date(t.date);
      const rowData = [
        dateObj.toLocaleDateString('id-ID'),
        dateObj.toLocaleTimeString('id-ID'),
        t.type,
        t.category,
        t.paymentMethod,
        t.branchId ? branches.find((b: any) => b.id === t.branchId)?.name || t.branchId : "Pusat",
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.amount)
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`laporan_keuangan_${new Date().getTime()}.pdf`);
  };

  const totalIncome = transactions.filter((t: FinanceTransaction) => t.type === "INCOME").reduce((sum: number, t: FinanceTransaction) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t: FinanceTransaction) => t.type === "EXPENSE").reduce((sum: number, t: FinanceTransaction) => sum + t.amount, 0);
  const operationalExpense = transactions.filter((t: FinanceTransaction) => t.type === "EXPENSE" && t.category.toLowerCase() !== "bagi hasil terapis").reduce((sum: number, t: FinanceTransaction) => sum + t.amount, 0);
  const labaKotor = totalIncome - operationalExpense;
  const netProfit = totalIncome - totalExpense;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const chartData = useMemo(() => {
    const dailyData: Record<string, { date: string, Pemasukan: number, Pengeluaran: number }> = {};

    [...transactions].reverse().forEach((t: FinanceTransaction) => {
      const date = new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      if (!dailyData[date]) {
        dailyData[date] = { date, Pemasukan: 0, Pengeluaran: 0 };
      }
      if (t.type === "INCOME") dailyData[date].Pemasukan += t.amount;
      if (t.type === "EXPENSE") dailyData[date].Pengeluaran += t.amount;
    });
    return Object.values(dailyData);
  }, [transactions]);

  const pieData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    transactions.filter((t: FinanceTransaction) => t.type === "INCOME").forEach((t: FinanceTransaction) => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const expensePieData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    transactions.filter((t: FinanceTransaction) => t.type === "EXPENSE").forEach((t: FinanceTransaction) => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Keuangan & Analitik</h2>
              <p className="text-gray-500 text-sm">Dashboard komprehensif performa finansial klinik.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(session?.role === "SUPER_ADMIN" || session?.role === "INVESTOR") && (
              <Link
                href="/admin/finance/accounting"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors mr-2"
              >
                <BookOpen className="h-5 w-5" /> Buku Besar & Laporan Akuntansi
              </Link>
            )}


            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-sm rounded-lg px-2 py-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-gray-700 font-bold text-sm cursor-pointer"
              />
              <span className="text-gray-400 font-bold px-1">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-gray-700 font-bold text-sm cursor-pointer"
              />
            </div>

            {(session?.role === "SUPER_ADMIN" || session?.role === "INVESTOR") && (
              <>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
                  title="Kelola Kategori"
                >
                  <Settings className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Download className="h-5 w-5" /> Export
                  </button>
                  
                  {isExportDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsExportDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        <button onClick={() => { handleExportCSV(); setIsExportDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Export CSV
                        </button>
                        <button onClick={() => { handleExportExcel(); setIsExportDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" /> Export Excel
                        </button>
                        <button onClick={() => { handleExportPDF(); setIsExportDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <FileIcon className="h-4 w-4" /> Export PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <Link
                  href="/admin/finance/expenses"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <TrendingDown className="h-5 w-5" /> Kelola Pengeluaran
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Cards */}
        {(session?.role === "SUPER_ADMIN" || session?.role === "INVESTOR") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 opacity-5 p-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-medium mb-2 relative z-10">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp className="h-5 w-5" /></div>
                  Pemasukan
                </div>
                <div className="text-3xl font-bold text-gray-900 relative z-10">{formatRupiah(totalIncome)}</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 opacity-5 p-4 group-hover:scale-110 transition-transform">
                  <TrendingDown className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-medium mb-2 relative z-10">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><TrendingDown className="h-5 w-5" /></div>
                  Pengeluaran Operasional
                </div>
                <div className="text-3xl font-bold text-gray-900 relative z-10">{formatRupiah(operationalExpense)}</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 opacity-5 p-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-medium mb-2 relative z-10">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp className="h-5 w-5" /></div>
                  Laba Kotor
                </div>
                <div className="text-3xl font-bold text-gray-900 relative z-10">{formatRupiah(labaKotor)}</div>
              </div>

              <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute right-0 top-0 opacity-10 p-4 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-32 w-32" />
                </div>
                <div className="flex items-center gap-2 text-blue-100 font-medium mb-2 relative z-10">
                  <div className="p-2 bg-white/20 rounded-lg text-white backdrop-blur-sm"><Wallet className="h-5 w-5" /></div>
                  Laba Bersih
                </div>
                <div className="text-4xl font-bold relative z-10">{formatRupiah(netProfit)}</div>
              </div>
            </div>

            {/* Analisis Diskon & Pendapatan Riil */}
            <div className="mb-8 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-blue-50/40 p-5 sm:p-6 rounded-2xl border border-emerald-100/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Analisis Pendapatan Riil & Diskon Pasien</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Komparasi omset bruto (sebelum diskon) vs penerimaan bersih setelah diskon serta akumulasi potongan diskon yang dinikmati pasien.
                  </p>
                </div>
                {discountSummary && discountSummary.discountedInvoicesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDiscountModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold text-xs sm:text-sm rounded-xl border border-emerald-200 shadow-sm transition-all hover:shadow self-start sm:self-auto cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-emerald-600" />
                    Lihat Rincian Diskon ({discountSummary.discountedInvoicesCount})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Pendapatan Riil (Sebelum Diskon) */}
                <div className="bg-white rounded-xl border border-emerald-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Receipt className="h-4 w-4" />
                      </div>
                      Pendapatan Riil (Bruto)
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-full">
                      Sebelum Diskon
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                    {formatRupiah(discountSummary?.totalSubtotal || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>Total {discountSummary?.totalInvoices || 0} struk diterbitkan</span>
                    <span className="font-medium text-emerald-700">100% Bruto</span>
                  </div>
                </div>

                {/* 2. Pendapatan Setelah Diskon (Net POS) */}
                <div className="bg-white rounded-xl border border-blue-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Wallet className="h-4 w-4" />
                      </div>
                      Pendapatan Riil Diterima
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded-full">
                      Setelah Diskon
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
                    {formatRupiah(discountSummary?.totalGrandTotal || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>Kas riil masuk dari POS</span>
                    <span className="font-medium text-blue-700">
                      {discountSummary && discountSummary.totalSubtotal > 0
                        ? `${(100 - (discountSummary.discountPercentage || 0)).toFixed(1)}% Realisasi`
                        : "100%"}
                    </span>
                  </div>
                </div>

                {/* 3. Total Pengeluaran Diskon */}
                <div className="bg-white rounded-xl border border-rose-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                      <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                        <Tag className="h-4 w-4" />
                      </div>
                      Total Pengeluaran Diskon
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase bg-rose-100/70 text-rose-800 px-2 py-0.5 rounded-full">
                      Potongan Pasien
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                    {formatRupiah(discountSummary?.totalDiscount || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>{discountSummary?.discountedInvoicesCount || 0} transaksi didiskon</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                      {(discountSummary?.discountPercentage || 0).toFixed(1)}% dari bruto
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-gray-400" /> Tren Keuangan</h3>
                <div className="h-72 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          tickFormatter={(value) => `Rp ${value / 1000}k`}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          width={80}
                          dx={-10}
                        />
                        <Tooltip
                          formatter={(value: any) => formatRupiah(Number(value))}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fillOpacity={1} fill="url(#colorPemasukan)" strokeWidth={3} activeDot={{ r: 8, strokeWidth: 0 }} />
                        <Area type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" fillOpacity={1} fill="url(#colorPengeluaran)" strokeWidth={3} activeDot={{ r: 8, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">Belum ada data untuk dirender grafik</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-gray-400" /> Proporsi Pemasukan</h3>
                  <div className="h-[450px] w-full">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                          >
                            {pieData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' }} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => formatRupiah(Number(value))}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 600 }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">Belum ada data<br />pemasukan</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-gray-400" /> Proporsi Pengeluaran</h3>
                  <div className="h-[450px] w-full">
                    {expensePieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                          >
                            {expensePieData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' }} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => formatRupiah(Number(value))}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 600 }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">Belum ada data<br />pengeluaran</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}



        {/* Manage Categories Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">Kelola Kategori Keuangan</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6">
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm w-32 font-medium flex items-center justify-center cursor-not-allowed">
                    Pengeluaran
                  </div>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
                    placeholder="Nama Kategori Baru"
                    required
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                  />
                  <button type="submit" className="bg-primary text-white px-3 py-2 rounded-lg"><Plus className="w-5 h-5" /></button>
                </form>

                <div className="space-y-4 max-h-64 overflow-y-auto">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pengeluaran (EXPENSE)</h4>
                    <ul className="space-y-2">
                      {categories.filter(c => c.type === "EXPENSE").map(c => (
                        <li key={c.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium capitalize">{c.name}</span>
                          <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Rincian Diskon Pasien */}
        {isDiscountModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Rincian Transaksi dengan Potongan Diskon</h3>
                    <p className="text-xs text-gray-500">
                      Daftar struk transaksi pasien yang mendapatkan potongan harga pada periode terpilih.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Stats Banner in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 sm:p-6 pb-4 bg-gray-50/70 border-b border-gray-100">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Total Bruto (Tanpa Diskon)</div>
                  <div className="text-lg font-bold text-gray-900 mt-0.5">
                    {formatRupiah(discountSummary?.totalSubtotal || 0)}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm">
                  <div className="text-xs font-semibold text-rose-600 uppercase">Total Diskon Diberikan</div>
                  <div className="text-lg font-bold text-rose-600 mt-0.5">
                    {formatRupiah(discountSummary?.totalDiscount || 0)}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm">
                  <div className="text-xs font-semibold text-blue-600 uppercase">Penerimaan Bersih POS</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">
                    {formatRupiah(discountSummary?.totalGrandTotal || 0)}
                  </div>
                </div>
              </div>

              {/* Table of Invoices with Discount */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                {(!discountSummary?.discountedInvoices || discountSummary.discountedInvoices.length === 0) ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada transaksi dengan potongan diskon pada rentang tanggal ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">No. Struk</th>
                          <th className="px-4 py-3 font-semibold">Tanggal & Waktu</th>
                          <th className="px-4 py-3 font-semibold">Pasien</th>
                          <th className="px-4 py-3 font-semibold">Cabang</th>
                          <th className="px-4 py-3 font-semibold text-right">Harga Bruto</th>
                          <th className="px-4 py-3 font-semibold text-right">Potongan Diskon</th>
                          <th className="px-4 py-3 font-semibold text-right">Total Dibayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {discountSummary.discountedInvoices.map((inv: DiscountInvoice) => {
                          const d = new Date(inv.createdAt);
                          const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
                          const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                          return (
                            <tr key={inv.id} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-xs text-gray-800">
                                {inv.invoiceNumber}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                                <div className="font-medium">{dateStr}</div>
                                <div className="text-gray-400 text-[11px]">{timeStr} WIB</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {inv.patientName}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                                  {inv.branchName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700 font-medium whitespace-nowrap">
                                {formatRupiah(inv.subtotal)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                                -{formatRupiah(inv.discount)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-blue-600 whitespace-nowrap">
                                {formatRupiah(inv.grandTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Menampilkan {discountSummary?.discountedInvoices?.length || 0} struk transaksi
                </span>
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Transaksi */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg">Riwayat Transaksi</h3>
            <span className="text-sm font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{transactions.length} Data</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              Memuat data keuangan...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Buku kas masih kosong di rentang waktu ini.</p>
              <p className="text-gray-400 text-sm mt-1">Mulai catat transaksi untuk melihat riwayat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="hidden sm:table-cell px-4 sm:px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold">Keterangan</th>
                    <th className="hidden md:table-cell px-4 sm:px-6 py-4 font-semibold">Kategori & Metode</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold text-right">Nominal</th>
                    <th className="px-4 sm:px-6 py-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t: FinanceTransaction) => {
                    const dateObj = new Date(t.date);
                    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                    const formattedTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

                    return (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {formattedTime}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-gray-900 line-clamp-2">{t.description}</div>

                          {/* Mobile-only info (Date & Category) */}
                          <div className="sm:hidden flex flex-col gap-1 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formattedDate} {formattedTime}</span>
                          </div>
                          <div className="md:hidden flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{t.category}</span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{t.paymentMethod || "CASH"}</span>
                          </div>

                          <div className="flex gap-2 mt-1 items-center">
                            {t.referenceId && <span className="text-xs text-blue-600">Ref: {t.referenceId}</span>}
                            {t.attachmentUrl && (
                              <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 border border-gray-200 px-1.5 py-0.5 rounded-md bg-white">
                                <LinkIcon className="w-3 h-3" /> Bukti
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border border-gray-200 capitalize">{t.category}</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                              <CreditCard className="w-3 h-3" /> {t.paymentMethod || "CASH"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right font-bold">
                          {t.type === "INCOME" ? (
                            <span className="text-blue-600">+{formatRupiah(t.amount)}</span>
                          ) : (
                            <span className="text-red-500">-{formatRupiah(t.amount)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Batalkan Transaksi">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(transactions.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={transactions.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
