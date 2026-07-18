"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, Download, Settings, X, Link as LinkIcon, BookOpen, Users } from "lucide-react";
import { SERVICES_LIST, getServicePrice } from "@/lib/pricing";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/layout/PageHeader";
import {
  LineChart,
  Line,
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



export default function AdminExpensesPage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  
  // Filters
  const [filterBranch, setFilterBranch] = useState("");
  const [dateFilter, setDateFilter] = useState("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: 'Asia/Jakarta', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(now);
    const d = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);
    
    return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`;
  };

  const [formData, setFormData] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    category: "",
    amount: 0 as number | string,
    description: "",
    branchId: "",
    paymentMethod: "CASH",
    attachmentUrl: "",
    date: getCurrentDateTimeLocal(),
  });

  const [personCount, setPersonCount] = useState<number>(1);

  useEffect(() => {
    if (!formData.category) return;
    const catLower = formData.category.toLowerCase();
    if (catLower === "biaya uang makan karyawan" || catLower === "biaya lembur terapis") {
      const categoryTitle = formData.category
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setFormData(prev => ({
        ...prev,
        description: `${categoryTitle} - ${personCount} Orang`
      }));
    }
  }, [formData.category, personCount]);

  const paymentMethods = ["CASH", "DEBIT", "TRANSFER BANK"];

  const expenseCategories = useMemo(() => Array.from(new Set(categories.filter(c => c.type === "EXPENSE").map(c => c.name))), [categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/finance/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          
          const expenses = data.filter((c: any) => c.type === "EXPENSE");
          if (expenses.length > 0 && !formData.category) {
            setFormData(prev => ({...prev, category: expenses[0].name}));
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
    
    fetchCategories();
    fetchBranches();
  }, []);

  const getDateRange = () => {
    const today = new Date();
    let startDate = "";
    let endDate = "";

    if (dateFilter === "today") {
      startDate = today.toISOString().split("T")[0];
      endDate = startDate;
    } else if (dateFilter === "thisWeek") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 7));
      startDate = firstDay.toISOString().split("T")[0];
      endDate = lastDay.toISOString().split("T")[0];
    } else if (dateFilter === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startObj = new Date(firstDay.getTime() - (firstDay.getTimezoneOffset() * 60000));
      const endObj = new Date(lastDay.getTime() - (lastDay.getTimezoneOffset() * 60000));
      startDate = startObj.toISOString().split("T")[0];
      endDate = endObj.toISOString().split("T")[0];
    } else if (dateFilter === "thisYear") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      const startObj = new Date(firstDay.getTime() - (firstDay.getTimezoneOffset() * 60000));
      const endObj = new Date(lastDay.getTime() - (lastDay.getTimezoneOffset() * 60000));
      startDate = startObj.toISOString().split("T")[0];
      endDate = endObj.toISOString().split("T")[0];
    } else if (dateFilter === "custom") {
      startDate = customStartDate;
      endDate = customEndDate;
    }
    return { startDate, endDate };
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams();
      if (filterBranch) params.append("branch", filterBranch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/finance?${params.toString()}`);
      if (res.ok) {
        const allTransactions = await res.json();
        setTransactions(allTransactions.filter((t: any) => {
          const isExpense = t.type === "EXPENSE";
          const descLower = (t.description || "").toLowerCase();
          const isAutomatedCommission = descLower.includes("bagi hasil terapis") || descLower.includes("pembayaran komisi terapis");
          
          return isExpense && !isAutomatedCommission;
        }));
      }
    } catch (err) {
      console.error("Failed to fetch finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter === "custom" && (!customStartDate || !customEndDate)) return; 
    setCurrentPage(1); // reset pagination when filters change
    fetchTransactions();
  }, [filterBranch, dateFilter, customStartDate, customEndDate]);

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
      const payload = {
        ...formData,
        // Append +07:00 to specify Jakarta timezone explicitly if not present
        date: new Date(`${formData.date}:00+07:00`).toISOString(),
      };
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsFormOpen(false);
      setFormData({ type: "EXPENSE", category: expenseCategories[0] || "", amount: 0, description: "", branchId: "", paymentMethod: "CASH", attachmentUrl: "", date: getCurrentDateTimeLocal() });
      setPersonCount(1);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };



  const handleExportCSV = () => {
    if (transactions.length === 0) return alert("Tidak ada data untuk diekspor");
    
    const headers = ["Tanggal", "Waktu", "Tipe", "Kategori", "Metode Pembayaran", "Deskripsi", "Cabang", "Nominal", "Referensi", "Attachment"];
    const csvRows = [headers.join(",")];
    
    transactions.forEach(t => {
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
        `"${t.branchId ? branches.find(b => b.id === t.branchId)?.name || t.branchId : "Pusat"}"`,
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

  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <PageHeader 
          title="Pengeluaran Klinik"
          description="Kelola semua catatan pengeluaran operasional dan gaji."
          icon={TrendingDown}
          rightContent={
            <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none transition-all cursor-pointer shadow-sm hover:bg-gray-50 font-medium"
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none transition-all cursor-pointer shadow-sm hover:bg-gray-50 font-medium"
              >
                <option value="today">Hari Ini</option>
                <option value="thisWeek">Minggu Ini</option>
                <option value="thisMonth">Bulan Ini</option>
                <option value="thisYear">Tahun Ini</option>
                <option value="custom">Kustom Rentang</option>
              </select>

              {dateFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={customStartDate} 
                    onChange={e => setCustomStartDate(e.target.value)} 
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition-all hover:bg-gray-50"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input 
                    type="date" 
                    value={customEndDate} 
                    onChange={e => setCustomEndDate(e.target.value)} 
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition-all hover:bg-gray-50"
                  />
                </div>
              )}

              <button 
                onClick={handleExportCSV}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Download className="h-5 w-5" /> Export CSV
              </button>

              <button 
                onClick={() => {
                  setFormData({ type: "EXPENSE", category: expenseCategories[0], amount: 0, description: "", branchId: filterBranch, paymentMethod: "CASH", attachmentUrl: "", date: getCurrentDateTimeLocal() });
                  setPersonCount(1);
                  setIsFormOpen(true);
                }}
                className="bg-white text-emerald-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-black/10 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" /> Catat Transaksi
              </button>
            </div>
          }
        />

        {/* Charts and Cards removed from expenses page */}

        {/* Transaction Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-0 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative transform transition-all animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-teal-500 z-10"></div>
              
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
                <h3 className="text-lg font-bold text-gray-800">Catat Transaksi Manual</h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tanggal Transaksi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-medium"><Calendar className="w-4 h-4" /></div>
                    <input 
                      type="datetime-local" 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      required 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Jenis Transaksi</label>
                  <div className="w-full px-4 py-2.5 bg-red-50 text-red-700 font-semibold border border-red-200 rounded-lg flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Pengeluaran (-)
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Kategori Pengeluaran</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors capitalize">
                    <optgroup label="Operasional">
                      {expenseCategories.filter(cat => !(cat.toLowerCase().includes("gaji") || cat.toLowerCase().includes("lembur") || cat.toLowerCase().includes("uang makan") || cat.toLowerCase().includes("kontrakan"))).map(cat => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Gaji">
                      {expenseCategories.filter(cat => cat.toLowerCase().includes("gaji") || cat.toLowerCase().includes("lembur") || cat.toLowerCase().includes("uang makan") || cat.toLowerCase().includes("kontrakan")).map(cat => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                {(formData.category.toLowerCase() === "biaya uang makan karyawan" || formData.category.toLowerCase() === "biaya lembur terapis") && (
                  <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                    <label className="text-sm font-semibold text-gray-700">Jumlah Orang</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={personCount} 
                      onChange={e => setPersonCount(parseInt(e.target.value) || 1)} 
                      required 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Metode Pembayaran</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                    {paymentMethods.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Cabang</label>
                  <select 
                    value={formData.branchId} 
                    onChange={e => {
                      setFormData({...formData, branchId: e.target.value});
                    }} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">Pusat / Tidak Spesifik</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nominal (Rp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-medium">Rp</div>
                    <input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value === "" ? "" : parseInt(e.target.value)})} required className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Keterangan / Detail</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Cth: Bekam Bapak Budi / Bayar Listrik" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><LinkIcon className="w-4 h-4"/> Bukti Pembayaran (URL/Link)</label>
                  <input type="url" value={formData.attachmentUrl} onChange={e => setFormData({...formData, attachmentUrl: e.target.value})} placeholder="Opsional: Link Google Drive/Image" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-5 border-t">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-md transition-colors">
                  {saving ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
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
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                    <th className="px-6 py-4 font-semibold">Kategori & Metode</th>
                    <th className="px-6 py-4 font-semibold text-right">Pengeluaran</th>
                    <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t) => {
                    const formattedDate = new Date(t.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Jakarta' });
                    const formattedTime = new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
                    
                    return (
                      <tr key={t.id} className="hover:bg-teal-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {formattedTime}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 line-clamp-2">{t.description}</div>
                          <div className="flex gap-2 mt-1 items-center">
                            {t.referenceId && <span className="text-xs text-teal-600">Ref: {t.referenceId}</span>}
                            {t.attachmentUrl && (
                              <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 border border-gray-200 px-1.5 py-0.5 rounded-md bg-white">
                                <LinkIcon className="w-3 h-3" /> Bukti
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border border-gray-200 capitalize">{t.category}</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">
                              <CreditCard className="w-3 h-3" /> {t.paymentMethod || "CASH"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-500">
                          {formatRupiah(t.amount)}
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
