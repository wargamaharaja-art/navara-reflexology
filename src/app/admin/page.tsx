"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Target, Save, Edit2, Calendar, Wallet, Package, Activity, Inbox, WalletCards, ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";
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
        
        <PageHeader 
          title="Dashboard Admin"
          description="Selamat datang! Ini adalah ringkasan performa dan kondisi keuangan klinik Navara Reflexology."
          icon={LayoutDashboard}
        />

        <div className="mt-8 space-y-8">
          
          {/* Total Asset & Key Metrics */}
          <div className="bg-white/90 backdrop-blur-md rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Total Aset Tersedia (Kas)</p>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">{formatRupiah(summaryData.kasDanBank)}</h2>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Bulan Ini
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-50 rounded-2xl">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Kas & Bank</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatRupiah(summaryData.kasDanBank)}</p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-amber-50 rounded-2xl">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Persediaan</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{summaryData.persediaan} <span className="text-sm font-normal text-gray-500">Item</span></p>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-indigo-50 rounded-2xl">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Pasien Hari Ini</p>
                </div>
                <p className="text-xl font-bold text-indigo-600">{summaryData.pasienHarian} <span className="text-sm font-normal text-gray-500">Orang</span></p>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-teal-50 rounded-2xl">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Pendapatan</p>
                </div>
                <p className="text-xl font-bold text-teal-600">{formatRupiah(summaryData.pendapatan)}</p>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-yellow-50 rounded-2xl">
                    <Activity className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Laba Bersih</p>
                </div>
                <p className="text-xl font-bold text-yellow-600">{formatRupiah(summaryData.labaBersih)}</p>
              </div>
            </div>
          </div>

          {/* Quick Links Menu Fitur */}
          <div>
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-xl font-bold text-gray-900">Menu Fitur</h3>
              <Link href="/admin/settings" className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
                Semua Fitur <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="bg-white/90 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col items-center justify-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all group"
                >
                  <div className={`w-16 h-16 rounded-[24px] ${link.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <link.icon className={`w-8 h-8 ${link.color}`} />
                  </div>
                  <span className="font-bold text-gray-800 text-center">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

        {/* Existing KPI Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-12 bg-white/90 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-3.5 rounded-2xl shadow-md text-white">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Performa KPI Bulanan</h2>
              <p className="text-gray-500 text-sm mt-1">Pemasukan & Kunjungan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input 
                type="month" 
                value={month} 
                onChange={e => setMonth(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700 shadow-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* Target Settings Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-500"/> Target ({month})
            </h3>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                <Edit2 className="w-4 h-4" /> Ubah Target
              </button>
            )}
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
                  <Save className="w-4 h-4"/> Simpan
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
                  <TrendingUp className="w-6 h-6"/>
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Target Kunjungan</p>
                  <p className="text-2xl font-extrabold text-blue-900">{targetVisits} <span className="text-sm font-medium text-blue-700">Pasien</span></p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500">
                  <Users className="w-6 h-6"/>
                </div>
              </div>
            </div>
          )}
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
                <TrendingUp className="w-5 h-5 text-emerald-500"/> Progres Capaian Pemasukan
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                    <XAxis dataKey="date" tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis 
                      tickFormatter={(val) => `Rp${(val/1000000).toFixed(1)}Jt`} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 12}}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [formatRupiah(Number(value)), name === "cumIncome" ? "Aktual Kumulatif" : "Target (Goals)"]}
                      labelFormatter={(label) => `Tanggal ${label} ${month}`}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-sm font-medium text-gray-700">{value === "cumIncome" ? "Pemasukan Aktual" : "Target Pemasukan"}</span>} />
                    <Line type="monotone" dataKey="targetCumIncome" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                    <Line type="monotone" dataKey="cumIncome" stroke="#10b981" strokeWidth={4} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visits Chart */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500"/> Progres Capaian Kunjungan
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff6ff" />
                    <XAxis dataKey="date" tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 12}}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [value, name === "cumVisits" ? "Aktual Kumulatif" : "Target (Goals)"]}
                      labelFormatter={(label) => `Tanggal ${label} ${month}`}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-sm font-medium text-gray-700">{value === "cumVisits" ? "Kunjungan Aktual" : "Target Kunjungan"}</span>} />
                    <Line type="monotone" dataKey="targetCumVisits" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                    <Line type="monotone" dataKey="cumVisits" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} connectNulls={false} />
                  </LineChart>
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
                <Sparkles className="w-6 h-6 text-emerald-500"/> Analisa Performa Bisnis AI
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
                  <Sparkles className="w-5 h-5"/> Mulai Analisa AI
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
                <style dangerouslySetInnerHTML={{__html: `
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
