"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Target, Save, Edit2, Calendar, Wallet, Package, Activity, Inbox, WalletCards, ArrowRight, LayoutDashboard, Sparkles, Bell, Eye, EyeOff, ChevronRight, Clock, Flame, Receipt, BookOpen } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ReactMarkdown from "react-markdown";
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [targetIncome, setTargetIncome] = useState(0);
  const [targetVisits, setTargetVisits] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState({
    kasDanBank: 0,
    pendapatan: 0,
    labaBersih: 0,
    persediaan: 0,
    pasienHarian: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editIncome, setEditIncome] = useState("");
  const [editVisits, setEditVisits] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAnalyzeAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch(`/api/ai-analysis?month=${month}`);
      const json = await res.json();
      if (json.success) {
        setAiResult(json.data);
      } else {
        setAiError(json.error);
      }
    } catch (e) {
      setAiError("Terjadi kesalahan sistem saat menghubungi AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, summaryRes] = await Promise.all([
        fetch(`/api/dashboard/kpi-chart?month=${month}`),
        fetch(`/api/dashboard/summary?month=${month}`)
      ]);

      if (kpiRes.ok) {
        const json = await kpiRes.json();
        setTargetIncome(json.targetIncome);
        setTargetVisits(json.targetVisits);
        setEditIncome(json.targetIncome.toString());
        setEditVisits(json.targetVisits.toString());
        setChartData(json.data);
      }

      if (summaryRes.ok) {
        const json = await summaryRes.json();
        if (json.success) {
          setSummaryData(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/dashboard/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          targetIncome: parseInt(editIncome) || 0,
          targetVisits: parseInt(editVisits) || 0
        })
      });
      setIsEditing(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const quickLinks = [
    { name: "Keuangan", icon: WalletCards, href: "/admin/finance", color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Reservasi", icon: Inbox, href: "/admin/reservations", color: "text-purple-400", bg: "bg-purple-400/10" },
    { name: "Inventaris", icon: Package, href: "/admin/inventory", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Layanan", icon: Activity, href: "/admin/services", color: "text-rose-400", bg: "bg-rose-400/10" }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Mobile Header (Seabank Style) - Only visible on Mobile */}
        <div className="md:hidden flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden p-1.5">
              <Image src="/navara-logo.png" alt="Navara Logo" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-[15px] leading-tight">Fikri Mochamad R...</h2>
              <p className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5">Role: Super Admin <span className="bg-gray-200 px-1.5 py-0.5 rounded-sm">Pst</span></p>
            </div>
          </div>
          <div className="relative p-2 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
            <Bell className="w-5 h-5 text-gray-700" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <PageHeader
            title="Dashboard Admin"
            description="Selamat datang! Ini adalah ringkasan performa dan kondisi keuangan klinik Navara Reflexology."
            icon={LayoutDashboard}
          />
        </div>

        <div className="mt-2 md:mt-8 space-y-4 md:space-y-8">

          {/* Desktop KPI Cards */}
          <div className="hidden md:block bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-800">Target & Pencapaian KPI</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Bulan:</span>
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors ml-2"
                  title="Ubah Target"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveTarget} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Pemasukan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editIncome}
                    onChange={e => setEditIncome(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Kunjungan (Orang)</label>
                  <input
                    type="number"
                    required
                    value={editVisits}
                    onChange={e => setEditVisits(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors w-full">Batal</button>
                  <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 w-full">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Target Pemasukan</p>
                    <p className="text-2xl font-extrabold text-emerald-900">{formatRupiah(targetIncome)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Target Kunjungan</p>
                    <p className="text-2xl font-extrabold text-blue-900">{targetVisits} <span className="text-sm font-medium text-blue-700">Pasien</span></p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:hidden space-y-4">
            {/* Seabank-style Top Balance Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-[20px] md:rounded-[32px] p-5 md:p-8 text-white relative overflow-hidden shadow-lg border border-emerald-400/50">
            {/* Background Watermark/Curves */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 border-[20px] border-emerald-400/30 rounded-full pointer-events-none"></div>
            <div className="absolute -right-20 top-0 w-32 h-32 border-[15px] border-emerald-400/20 rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1.5">
                     <span className="text-xs font-semibold text-emerald-50 tracking-wide">Total Kas & Bank</span>
                     <button onClick={() => setShowBalance(!showBalance)} className="hover:bg-emerald-400/30 p-1 rounded-full transition-colors">
                        {showBalance ? <Eye className="w-4 h-4 text-emerald-50" /> : <EyeOff className="w-4 h-4 text-emerald-50" />}
                     </button>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                     {showBalance ? formatRupiah(summaryData.kasDanBank) : "Rp ••••••••"}
                  </h2>
               </div>
               <Link href="/admin/finance" className="bg-emerald-700/60 hover:bg-emerald-700 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 transition-colors border border-emerald-500/50 shadow-inner">
                 Riwayat <ChevronRight className="w-3 h-3" />
               </Link>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-400/30">
               <div>
                 <Link href="/admin/finance" className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-emerald-100 hover:text-white mb-1 w-max">
                    Pendapatan <ChevronRight className="w-3 h-3" />
                 </Link>
                 <p className="text-[15px] md:text-xl font-bold mt-0.5">
                    {showBalance ? formatRupiah(summaryData.pendapatan) : "Rp ••••••••"}
                 </p>
                 <p className="text-[9px] text-emerald-200 mt-1 bg-emerald-700/40 px-1.5 py-0.5 rounded-sm inline-block border border-emerald-600/50">Bulan ini</p>
               </div>
               <div>
                 <Link href="/admin/finance" className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-emerald-100 hover:text-white mb-1 w-max">
                    Laba Bersih <ChevronRight className="w-3 h-3" />
                 </Link>
                 <p className="text-[15px] md:text-xl font-bold mt-0.5">
                    {showBalance ? formatRupiah(summaryData.labaBersih) : "Rp ••••••••"}
                 </p>
                 <p className="text-[9px] text-emerald-200 mt-1 bg-emerald-700/40 px-1.5 py-0.5 rounded-sm inline-block border border-emerald-600/50">Hingga hari ini</p>
               </div>
            </div>
          </div>

          {/* Quick Links Menu Fitur (Seabank 8-Grid Style) */}
          <div className="bg-white rounded-[20px] md:rounded-[32px] p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
            <div className="grid grid-cols-4 gap-y-5 gap-x-2">
              {[
                { name: "Transfer", icon: WalletCards, href: "/admin/finance", color: "text-orange-500", badge: "" },
                { name: "Reservasi", icon: Inbox, href: "/admin/reservations", color: "text-emerald-500", badge: "Baru" },
                { name: "Kunjungan", icon: Calendar, href: "/admin/visits", color: "text-blue-500", badge: "" },
                { name: "Pegawai", icon: Users, href: "/admin/therapists", color: "text-purple-500", badge: "" },
                { name: "Inventaris", icon: Package, href: "/admin/inventory", color: "text-amber-500", badge: "Promo" },
                { name: "Layanan", icon: Activity, href: "/admin/services", color: "text-rose-500", badge: "" },
                { name: "Laporan", icon: Receipt, href: "/admin/finance", color: "text-teal-500", badge: "" },
                { name: "Semua", icon: LayoutDashboard, href: "/admin/settings", color: "text-gray-500", badge: "" }
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex flex-col items-center justify-start gap-1.5 relative group"
                >
                  <div className="w-[42px] h-[42px] rounded-[14px] bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform">
                    <link.icon className={`w-[22px] h-[22px] ${link.color} fill-${link.color.split('-')[1]}-100`} strokeWidth={2} />
                  </div>
                  {link.badge && (
                    <span className="absolute -top-1.5 right-0 md:right-4 bg-orange-100 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-orange-200 uppercase tracking-widest z-10">
                      {link.badge}
                    </span>
                  )}
                  <span className="font-semibold text-[10px] text-gray-700 text-center w-full">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>


          </div>

          {/* Charts Section */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Memuat grafik KPI...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">

              {/* Income Chart */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Progres Capaian Pemasukan
                </h3>
                <div className="h-[400px] sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                      <XAxis dataKey="date" tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}Jt`}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        width={55}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          const formattedValue = formatRupiah(Number(value));
                          let label = name;
                          if (name === "cumIncome") label = "Aktual Kumulatif";
                          if (name === "targetCumIncome") label = "Target Kumulatif (Goals)";
                          if (name === "actualIncome") label = "Pemasukan Harian";
                          return [formattedValue, label];
                        }}
                        labelFormatter={(label) => `Tanggal ${label} ${month}`}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36} formatter={(value) => {
                        let label = value;
                        if (value === "cumIncome") label = "Aktual Kumulatif";
                        if (value === "targetCumIncome") label = "Target Kumulatif";
                        if (value === "actualIncome") label = "Pemasukan Harian";
                        return <span className="text-sm font-medium text-gray-700">{label}</span>;
                      }} />
                      <Bar dataKey="actualIncome" fill="#a7f3d0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line type="monotone" dataKey="targetCumIncome" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                      <Line type="monotone" dataKey="cumIncome" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visits Chart */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> Progres Capaian Kunjungan
                </h3>
                <div className="h-[400px] sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff6ff" />
                      <XAxis dataKey="date" tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        width={30}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          let label = name;
                          if (name === "cumVisits") label = "Aktual Kumulatif";
                          if (name === "targetCumVisits") label = "Target Kumulatif (Goals)";
                          if (name === "actualVisits") label = "Kunjungan Harian";
                          return [value, label];
                        }}
                        labelFormatter={(label) => `Tanggal ${label} ${month}`}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36} formatter={(value) => {
                        let label = value;
                        if (value === "cumVisits") label = "Aktual Kumulatif";
                        if (value === "targetCumVisits") label = "Target Kumulatif";
                        if (value === "actualVisits") label = "Kunjungan Harian";
                        return <span className="text-sm font-medium text-gray-700">{label}</span>;
                      }} />
                      <Bar dataKey="actualVisits" fill="#bfdbfe" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line type="monotone" dataKey="targetCumVisits" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                      <Line type="monotone" dataKey="cumVisits" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* AI Analysis Section */}
          <div className="mt-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[32px] p-6 md:p-8 border border-teal-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-500" /> Analisa Performa Bisnis AI
                </h3>
                <p className="text-teal-600/80 text-sm mt-1 font-medium">Dapatkan insight dan saran strategis berdasarkan performa bulan ini menggunakan Google Gemini AI.</p>
              </div>
              <button
                onClick={handleAnalyzeAI}
                disabled={aiLoading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {aiLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menganalisa...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Mulai Analisa AI
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-bold mb-4 relative z-10">
                {aiError}
              </div>
            )}

            {aiResult && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-teal-100/50 relative z-10 overflow-auto shadow-sm">
                <div className="markdown-ai text-gray-800 space-y-4">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                  .markdown-ai h1 { font-size: 1.5rem; font-weight: 900; color: #134e4a; margin-bottom: 1rem; }
                  .markdown-ai h2 { font-size: 1.25rem; font-weight: 800; color: #115e59; margin-top: 1.5rem; margin-bottom: 0.75rem; }
                  .markdown-ai h3 { font-size: 1.125rem; font-weight: 700; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem; }
                  .markdown-ai p { line-height: 1.6; margin-bottom: 1rem; }
                  .markdown-ai ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                  .markdown-ai ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                  .markdown-ai li { margin-bottom: 0.25rem; }
                  .markdown-ai strong { font-weight: 800; color: #115e59; }
                  .markdown-ai blockquote { border-left: 4px solid #0d9488; background: #f0fdfa; padding: 1rem; border-radius: 0.5rem; color: #115e59; font-style: italic; }
                `}} />
                  <ReactMarkdown>{aiResult}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
