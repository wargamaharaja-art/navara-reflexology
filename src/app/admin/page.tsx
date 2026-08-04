"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, Save, Edit2, Calendar, Wallet, Package, Activity, Inbox, WalletCards, ArrowRight, LayoutDashboard, Sparkles, Bell, Eye, EyeOff, ChevronRight, Clock, Flame, Receipt, BookOpen, CalendarCheck, Settings, Star, MapPin, Check, ChevronDown } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ReactMarkdown from "react-markdown";
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const AnimatedNumber = ({ value, isCurrency = true }: { value: number, isCurrency?: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 700;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{isCurrency ? formatRupiah(count) : count}</>;
};

// Therapist Status Dashboard Widget
function TherapistStatusWidget({ showBalance }: { showBalance: boolean }) {
  const [counts, setCounts] = useState({ AVAILABLE: 0, BUSY: 0, BREAK: 0, OFF: 0, total: 0 });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/therapists/availability`);
        if (res.ok) {
          const data = await res.json();
          const list = data.data || [];
          setCounts({
            AVAILABLE: list.filter((t: any) => t.availabilityStatus === "AVAILABLE").length,
            BUSY: list.filter((t: any) => t.availabilityStatus === "BUSY").length,
            BREAK: list.filter((t: any) => t.availabilityStatus === "BREAK").length,
            OFF: list.filter((t: any) => t.availabilityStatus === "OFF").length,
            total: list.length,
          });
        }
      } catch {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50/50 border border-gray-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] p-5 flex flex-col justify-between min-h-[155px] hover:bg-white hover:shadow-md hover:border-purple-400 hover:-translate-y-1.5 transition-all duration-300 group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-[12px] bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Users className="w-5 h-5 text-purple-700" />
        </div>
        <span className="text-[11px] font-black text-purple-800 uppercase tracking-wider leading-tight">Status<br/>Terapis</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5">🟢 Tersedia</span>
          <span className="text-sm font-black text-blue-600">{counts.AVAILABLE}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5">🟡 Bertugas</span>
          <span className="text-sm font-black text-amber-600">{counts.BUSY}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5">🔴 Tidak Masuk</span>
          <span className="text-sm font-black text-red-600">{counts.OFF}</span>
        </div>
        {counts.BREAK > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5">🟠 Istirahat</span>
            <span className="text-sm font-black text-orange-600">{counts.BREAK}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [session, setSession] = useState<any>(null);

  const [targetIncome, setTargetIncome] = useState(0);
  const [targetVisits, setTargetVisits] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({
    kasDanBank: 0,
    pendapatan: 0,
    labaBersih: 0,
    pengeluaran: 0,
    persediaan: 0,
    pasienHarian: 0,
    pasienKemarin: 0,
    pendapatanHarian: 0,
    transaksiHarian: 0,
    pendapatanKemarin: 0,
    pengeluaranOperasionalHarian: 0,
    pengeluaranOperasionalKemarin: 0,
    reservationsBaru: 0,
    topServicesToday: [],
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
      const [kpiRes, summaryRes, sessionRes] = await Promise.all([
        fetch(`/api/dashboard/kpi-chart?month=${month}`),
        fetch(`/api/dashboard/summary?month=${month}`),
        fetch("/api/auth/session")
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
      
      if (sessionRes.ok) {
        const sJson = await sessionRes.json();
        setSession(sJson.session);
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
    { name: "Inventaris", icon: Package, href: "/admin/inventory", color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Layanan", icon: Activity, href: "/admin/services", color: "text-rose-400", bg: "bg-rose-400/10" }
  ];

  const lastValidData = chartData.filter(d => d.cumIncome !== null).pop();
  const totalCumIncome = lastValidData ? lastValidData.cumIncome : 0;
  const incomePercent = targetIncome > 0 ? Math.min(100, Math.round(((totalCumIncome as number) / targetIncome) * 100)) : 0;
  
  const totalCumVisits = lastValidData ? lastValidData.cumVisits : 0;
  const visitsPercent = targetVisits > 0 ? Math.min(100, Math.round(((totalCumVisits as number) / targetVisits) * 100)) : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Mobile Header (Seabank Style) - Only visible on Mobile */}
        <div className="md:hidden flex flex-col gap-3 mb-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden p-1.5">
                <Image src="/logo.png" alt="Radja Bekam Logo" width={36} height={36} className="object-contain" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-[15px] leading-tight truncate max-w-[150px]">{session?.name || "Memuat..."}</h2>
                <p className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5">Role: Super Admin</p>
              </div>
            </div>
            <div className="relative p-2 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
              <Bell className="w-5 h-5 text-gray-700" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            </div>
          </div>
          {/* Mobile Branch Selector */}
          <div className="flex justify-start w-full z-50 relative">
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <PageHeader
            title="Dashboard Admin"
            description={`Selamat datang kembali 👋 • ${new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}`}
            icon={LayoutDashboard}
            rightContent={
              <div className="flex items-center gap-3 z-50">
                <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-600">Update terakhir: <span className="text-gray-900">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span></span>
                </div>
              </div>
            }
          />
        </div>
        <div className="mt-2 md:mt-8 space-y-4 md:space-y-8">

          {/* Desktop KPI Cards (Mockup Style) */}
          <div className="hidden md:flex flex-col mb-8">
            {/* Laba Bersih Highlight Card */}
            {(session?.role === "SUPER_ADMIN" || session?.role === "INVESTOR") && (
              <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 rounded-[28px] p-8 shadow-sm border border-blue-500/30 relative overflow-hidden mb-6 flex justify-between items-center group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                
                <div className="relative z-10 w-1/2">
                  <p className="text-blue-100 font-bold text-[11px] md:text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-300" />
                    Laba Bersih <span className="bg-white/20 text-white px-2 py-0.5 rounded-md text-[9px] ml-1">Bulan Ini</span>
                    <button onClick={() => setShowBalance(!showBalance)} className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10" title={showBalance ? 'Sembunyikan nominal' : 'Tampilkan nominal'}>
                      {showBalance ? <Eye className="w-4 h-4 text-white/80" /> : <EyeOff className="w-4 h-4 text-white/80" />}
                    </button>
                  </p>
                  <h2 className="text-5xl xl:text-6xl font-black text-white tracking-tighter drop-shadow-md pb-1">
                    {showBalance ? <AnimatedNumber value={summaryData.labaBersih} /> : <span className="tracking-wider">Rp ••••••••</span>}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-blue-50 text-sm font-medium">
                    <span className={`bg-white/20 px-2 py-1 rounded text-white font-bold flex items-center gap-1 ${Number(summaryData.labaBersih) >= Number(summaryData.labaBersihBulanLalu || 0) ? 'text-blue-100' : 'text-rose-200'}`}>
                      {Number(summaryData.labaBersih) >= Number(summaryData.labaBersihBulanLalu || 0) ? '↑' : '↓'} 
                      {Number(summaryData.labaBersihBulanLalu) > 0 
                        ? `${Math.abs(Math.round((Number(summaryData.labaBersih) - Number(summaryData.labaBersihBulanLalu)) / Number(summaryData.labaBersihBulanLalu) * 100))}%` 
                        : (Number(summaryData.labaBersih) > 0 ? '100%' : '0%')}
                    </span>
                    vs bulan lalu
                  </div>
                </div>

                {/* Right Side Summary */}
                <div className="relative z-10 w-[45%] bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-inner flex flex-col gap-4">
                   <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-blue-50 text-sm font-medium flex items-center gap-1.5"><Package className="w-4 h-4" /> Omzet Bulan Ini</span>
                      <div className="text-right">
                        <span className="text-white font-bold text-lg">{showBalance ? <AnimatedNumber value={summaryData.pendapatan} /> : <span>Rp ••••••</span>}</span>
                        {showBalance && <div className={`text-[10px] font-bold ${Number(summaryData.pendapatan) >= Number(summaryData.pendapatanBulanLalu || 0) ? 'text-blue-300' : 'text-rose-300'} flex items-center justify-end gap-1 mt-0.5`}>
                          {Number(summaryData.pendapatan) >= Number(summaryData.pendapatanBulanLalu || 0) ? '↑' : '↓'}
                          {Number(summaryData.pendapatanBulanLalu) > 0 
                            ? ` ${Math.abs(Math.round((Number(summaryData.pendapatan) - Number(summaryData.pendapatanBulanLalu)) / Number(summaryData.pendapatanBulanLalu) * 100))}%` 
                            : (Number(summaryData.pendapatan) > 0 ? ' 100%' : ' 0%')}
                          <span className="text-white/60 font-medium">vs bulan lalu</span>
                        </div>}
                      </div>
                   </div>
                   <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-blue-50 text-sm font-medium flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Pengeluaran</span>
                      <div className="text-right">
                        <span className="text-rose-200 font-bold text-lg">{showBalance ? <AnimatedNumber value={summaryData.pengeluaran} /> : <span>Rp ••••••</span>}</span>
                        {showBalance && <div className={`text-[10px] font-bold ${Number(summaryData.pengeluaran) <= Number(summaryData.pengeluaranBulanLalu || 0) ? 'text-blue-300' : 'text-rose-300'} flex items-center justify-end gap-1 mt-0.5`}>
                          {Number(summaryData.pengeluaran) >= Number(summaryData.pengeluaranBulanLalu || 0) ? '↑' : '↓'}
                          {Number(summaryData.pengeluaranBulanLalu) > 0 
                            ? ` ${Math.abs(Math.round((Number(summaryData.pengeluaran) - Number(summaryData.pengeluaranBulanLalu)) / Number(summaryData.pengeluaranBulanLalu) * 100))}%` 
                            : (Number(summaryData.pengeluaran) > 0 ? ' 100%' : ' 0%')}
                          <span className="text-white/60 font-medium">vs bulan lalu</span>
                        </div>}
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-blue-50 text-sm font-medium flex items-center gap-1.5"><Target className="w-4 h-4" /> Capaian Target</span>
                      <span className="text-blue-300 font-black text-lg">{showBalance ? (incomePercent === 0 ? "Belum ditentukan" : `${incomePercent}%`) : "••%"}</span>
                   </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-4 mb-8">
               <Link href="/admin/reservations" className="group bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-bold text-sm flex items-center gap-2 transition-all hover:border-purple-400 hover:text-purple-600 hover:-translate-y-1 hover:shadow-md">
                  <Inbox className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" /> + Reservasi Baru
               </Link>
               <Link href="/admin/visits" className="group bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-bold text-sm flex items-center gap-2 transition-all hover:border-sky-400 hover:text-sky-600 hover:-translate-y-1 hover:shadow-md">
                  <Users className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" /> + Tambah Pasien
               </Link>
               <Link href="/admin/finance" className="group bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-bold text-sm flex items-center gap-2 transition-all hover:border-blue-400 hover:text-blue-600 hover:-translate-y-1 hover:shadow-md">
                  <Wallet className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" /> + Input Transaksi
               </Link>
               <Link href="/admin/finance" className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-bold text-sm flex items-center gap-2 transition-all hover:border-blue-400 hover:text-blue-600 hover:-translate-y-0.5">
                  <Receipt className="w-4 h-4" /> Cetak Laporan
               </Link>
            </div>



            {/* Refactored Inner Cards Hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
              
              {/* Kategori B: Operasional */}
              <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest">Operasional</h4>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] md:text-xs font-bold tracking-wide">Hari Ini</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 xl:gap-5">
                  {/* Pendapatan Hari Ini */}
                  <div className="bg-gray-50/50 border border-gray-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] p-5 flex flex-col justify-between min-h-[155px] hover:bg-white hover:shadow-md hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-[12px] bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-5 h-5 text-blue-700" />
                      </div>
                      <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider leading-tight">Pendapatan<br/>Harian</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium mb-1">Pemasukan Hari Ini</p>
                      <p className="text-xl xl:text-2xl font-black text-blue-700 tracking-tighter">{showBalance ? <AnimatedNumber value={summaryData.pendapatanHarian} /> : <span className="tracking-wider">Rp ••••••</span>}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${Number(summaryData.pendapatanHarian) >= Number(summaryData.pendapatanKemarin || 0) ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                          {Number(summaryData.pendapatanHarian) >= Number(summaryData.pendapatanKemarin || 0) ? '🟢 ↑' : '🔴 ↓'} 
                          {Number(summaryData.pendapatanKemarin) > 0 
                            ? ` ${(Number(summaryData.pendapatanHarian) >= Number(summaryData.pendapatanKemarin) ? '+' : '')}${Math.round((Number(summaryData.pendapatanHarian) - Number(summaryData.pendapatanKemarin)) / Number(summaryData.pendapatanKemarin) * 100)}%` 
                            : (Number(summaryData.pendapatanHarian) > 0 ? ' +100%' : ' 0%')}
                        </span>
                        <span className="text-[9px] text-gray-500 font-medium">vs kemarin</span>
                      </div>
                    </div>
                  </div>

                  {/* Pasien Hari Ini */}
                  <div className="bg-gray-50/50 border border-gray-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] p-5 flex flex-col justify-between min-h-[155px] hover:bg-white hover:shadow-md hover:border-indigo-400 hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-[12px] bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-5 h-5 text-indigo-700" />
                      </div>
                      <span className="text-[11px] font-black text-indigo-800 uppercase tracking-wider leading-tight">Kunjungan<br/>Pasien</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium mb-1">Total Tamu Masuk</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-3xl xl:text-4xl font-black text-indigo-600 tracking-tighter leading-none"><AnimatedNumber value={summaryData.pasienHarian} isCurrency={false}/></p>
                        <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Orang</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${Number(summaryData.pasienHarian) >= Number(summaryData.pasienKemarin || 0) ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                          {Number(summaryData.pasienHarian) >= Number(summaryData.pasienKemarin || 0) ? '🟢 ↑' : '🔴 ↓'} 
                          {Number(summaryData.pasienHarian) - Number(summaryData.pasienKemarin || 0) > 0 ? ` +${Number(summaryData.pasienHarian) - Number(summaryData.pasienKemarin || 0)}` : ` ${Number(summaryData.pasienHarian) - Number(summaryData.pasienKemarin || 0)}`}
                        </span>
                        <span className="text-[9px] text-gray-500 font-medium">vs kemarin</span>
                      </div>
                    </div>
                  </div>

                  {/* Terapis Hari Ini — Live Status */}
                  <TherapistStatusWidget showBalance={showBalance} />

                  {/* Pengeluaran Operasional Hari Ini */}
                  <div className="bg-gray-50/50 border border-gray-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] p-5 flex flex-col justify-between min-h-[155px] hover:bg-white hover:shadow-md hover:border-orange-400 hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-[12px] bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <TrendingDown className="w-5 h-5 text-orange-700" />
                      </div>
                      <span className="text-[11px] font-black text-orange-800 uppercase tracking-wider leading-tight">Pengeluaran<br/>Operasional</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium mb-1">Pengeluaran Hari Ini</p>
                      <p className="text-xl xl:text-2xl font-black text-orange-600 tracking-tighter">{showBalance ? <AnimatedNumber value={summaryData.pengeluaranOperasionalHarian} /> : <span className="tracking-wider">Rp ••••••</span>}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${Number(summaryData.pengeluaranOperasionalHarian) <= Number(summaryData.pengeluaranOperasionalKemarin || 0) ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                          {Number(summaryData.pengeluaranOperasionalHarian) <= Number(summaryData.pengeluaranOperasionalKemarin || 0) ? '🟢 ↓' : '🔴 ↑'} 
                          {Number(summaryData.pengeluaranOperasionalKemarin) > 0 
                            ? ` ${(Number(summaryData.pengeluaranOperasionalHarian) >= Number(summaryData.pengeluaranOperasionalKemarin) ? '+' : '')}${Math.round((Number(summaryData.pengeluaranOperasionalHarian) - Number(summaryData.pengeluaranOperasionalKemarin)) / Number(summaryData.pengeluaranOperasionalKemarin) * 100)}%` 
                            : (Number(summaryData.pengeluaranOperasionalHarian) > 0 ? ' +100%' : ' 0%')}
                        </span>
                        <span className="text-[9px] text-gray-500 font-medium">vs kemarin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Kategori A: Top Layanan Hari Ini */}
              <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">Top Layanan Hari Ini</h4>
                  </div>
                  <div className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-200 shadow-sm">
                    <span className="text-[10px] md:text-xs font-bold tracking-wide">⭐ Layanan Terlaris</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-5 xl:gap-6">
                  {summaryData.topServicesToday?.map((service: any, index: number) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                        <span className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-amber-500' : 'bg-purple-500'}`}>{index + 1}</span>
                          {service.name} <span className="text-[11px] text-gray-400 font-medium">({service.count}x)</span>
                        </span>
                        <span className="font-black text-gray-900">{service.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-amber-500' : 'bg-purple-500'} relative overflow-hidden`}
                          style={{ width: `${service.percentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!summaryData.topServicesToday || summaryData.topServicesToday.length === 0) && (
                    <div className="text-center text-gray-400 text-sm py-8 font-medium">Belum ada layanan hari ini</div>
                  )}
                </div>
              </div>

            </div>

            {/* Menu Fitur Section */}
            <div className="mt-2 hidden md:block">
              <div className="flex justify-between items-center mb-6 px-2">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    Menu Fitur Utama
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Akses cepat ke seluruh modul sistem</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Reservasi Online */}
                <Link href="/admin/reservations" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-purple-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-purple-50 flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner border border-purple-100/50">
                      <Inbox className="w-7 h-7 xl:w-8 xl:h-8 text-purple-500 group-hover:text-white transition-colors" />
                    </div>
                    {/* Badge Status */}
                    {summaryData.reservationsBaru > 0 && (
                      <div className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-rose-100 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-wide">{summaryData.reservationsBaru} Baru</span>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">Reservasi Online</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Kelola jadwal & booking pasien</p>
                  </div>
                </Link>

                {/* Buku Pasien */}
                <Link href="/admin/visits" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-sky-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-sky-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-sky-50 flex items-center justify-center group-hover:bg-sky-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-inner border border-sky-100/50">
                      <CalendarCheck className="w-7 h-7 xl:w-8 xl:h-8 text-sky-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-sky-600 transition-colors">Buku Pasien</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Rekam medis & history</p>
                  </div>
                </Link>

                {/* Transaksi Pelanggan */}
                <Link href="/admin/transactions" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner border border-blue-100/50">
                      <BookOpen className="w-7 h-7 xl:w-8 xl:h-8 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    {/* Badge Status */}
                    <div className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-blue-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-[10px] font-bold tracking-wide">Hari ini {summaryData.transaksiHarian || 0} trx</span>
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Transaksi Pelanggan</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Catat & validasi kas masuk</p>
                  </div>
                </Link>

                {/* Layanan Terapi */}
                <Link href="/admin/services" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-rose-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-rose-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-inner border border-rose-100/50">
                      <Activity className="w-7 h-7 xl:w-8 xl:h-8 text-rose-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-rose-600 transition-colors">Layanan Terapi</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Katalog menu & harga layanan</p>
                  </div>
                </Link>
                
                {/* Pegawai */}
                <Link href="/admin/therapists" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner border border-indigo-100/50">
                      <Users className="w-7 h-7 xl:w-8 xl:h-8 text-indigo-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">Data Pegawai</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Kelola data terapis & admin</p>
                  </div>
                </Link>

                {/* Inventaris */}
                <Link href="/admin/inventory" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-inner border border-blue-100/50">
                      <Package className="w-7 h-7 xl:w-8 xl:h-8 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    {/* Badge Status */}
                    <div className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span className="text-[10px] font-bold tracking-wide">3 Menipis</span>
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Inventaris Klinik</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Stok obat & perlengkapan</p>
                  </div>
                </Link>

                {/* Keuangan */}
                <Link href="/admin/finance" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner border border-blue-100/50">
                      <Wallet className="w-7 h-7 xl:w-8 xl:h-8 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Buku Keuangan</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Laba rugi & mutasi kas</p>
                  </div>
                </Link>

                {/* Pengaturan */}
                <Link href="/admin/settings" className="bg-white rounded-[24px] xl:rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[160px] hover:shadow-xl hover:-translate-y-1.5 hover:border-slate-300 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-slate-500/5 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-slate-50 flex items-center justify-center group-hover:bg-slate-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-inner border border-slate-100/50">
                      <Settings className="w-7 h-7 xl:w-8 xl:h-8 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-[15px] xl:text-[17px] font-black text-gray-900 mb-1 group-hover:text-slate-600 transition-colors">Pengaturan</h4>
                    <p className="text-[11px] xl:text-[12px] text-gray-500 font-medium line-clamp-1">Konfigurasi & izin cabang</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {/* Seabank-style Top Balance Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-[20px] md:rounded-[32px] p-5 md:p-8 text-white relative overflow-hidden shadow-lg border border-blue-400/50">
            {/* Background Watermark/Curves */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 border-[20px] border-blue-400/30 rounded-full pointer-events-none"></div>
            <div className="absolute -right-20 top-0 w-32 h-32 border-[15px] border-blue-400/20 rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1.5">
                     <span className="text-xs font-semibold text-blue-50 tracking-wide">Laba Bersih</span>
                     <button onClick={() => setShowBalance(!showBalance)} className="hover:bg-blue-400/30 p-1 rounded-full transition-colors">
                        {showBalance ? <Eye className="w-4 h-4 text-blue-50" /> : <EyeOff className="w-4 h-4 text-blue-50" />}
                     </button>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                     {showBalance ? formatRupiah(summaryData.labaBersih) : "Rp ••••••••"}
                  </h2>
               </div>
               <Link href="/admin/finance" className="bg-blue-700/60 hover:bg-blue-700 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 transition-colors border border-blue-500/50 shadow-inner">
                 Riwayat <ChevronRight className="w-3 h-3" />
               </Link>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-blue-400/30">
               <div>
                 <Link href="/admin/finance" className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-blue-100 hover:text-white mb-1 w-max">
                    Pendapatan <ChevronRight className="w-3 h-3" />
                 </Link>
                 <p className="text-[15px] md:text-xl font-bold mt-0.5">
                    {showBalance ? formatRupiah(summaryData.pendapatan) : "Rp ••••••••"}
                 </p>
                 <p className="text-[9px] text-blue-200 mt-1 bg-blue-700/40 px-1.5 py-0.5 rounded-sm inline-block border border-blue-600/50">Bulan ini</p>
               </div>
               <div>
                 <Link href="/admin/finance" className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-blue-100 hover:text-white mb-1 w-max">
                    Pengeluaran <ChevronRight className="w-3 h-3" />
                 </Link>
                 <p className="text-[15px] md:text-xl font-bold mt-0.5">
                    {showBalance ? formatRupiah(summaryData.pengeluaran) : "Rp ••••••••"}
                 </p>
                 <p className="text-[9px] text-blue-200 mt-1 bg-blue-700/40 px-1.5 py-0.5 rounded-sm inline-block border border-blue-600/50">Hingga hari ini</p>
               </div>
            </div>
          </div>

          {/* Quick Links Menu Fitur (Seabank 8-Grid Style) */}
          <div className="bg-white rounded-[20px] md:rounded-[32px] p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
            <div className="grid grid-cols-4 gap-y-5 gap-x-2">
              {[
                { name: "Transfer", icon: WalletCards, href: "/admin/finance", color: "text-orange-500", badge: "" },
                { name: "Reservasi", icon: Inbox, href: "/admin/reservations", color: "text-blue-500", badge: "Baru" },
                { name: "Kunjungan", icon: Calendar, href: "/admin/visits", color: "text-blue-500", badge: "" },
                { name: "Pegawai", icon: Users, href: "/admin/therapists", color: "text-purple-500", badge: "" },
                { name: "Inventaris", icon: Package, href: "/admin/inventory", color: "text-amber-500", badge: "Promo" },
                { name: "Layanan", icon: Activity, href: "/admin/services", color: "text-rose-500", badge: "" },
                { name: "Laporan", icon: Receipt, href: "/admin/finance", color: "text-blue-500", badge: "" },
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
          {(session?.role === "SUPER_ADMIN" || session?.role === "INVESTOR") && (
            loading ? (
              <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Memuat grafik KPI...</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 gap-8">

              {/* Income Chart */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8 relative overflow-hidden group hover:border-blue-200 transition-colors duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" /> Progres Capaian Pemasukan
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">Total Pemasukan: {formatRupiah(summaryData.pendapatan)}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-bold tracking-wide">Target {incomePercent}% Tercapai</span>
                    </div>
                    {isEditing ? (
                      <form onSubmit={handleSaveTarget} className="mt-2 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">Target: Rp</span>
                          <input 
                            type="number" 
                            value={editIncome}
                            onChange={(e) => setEditIncome(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-xs w-28 focus:outline-none focus:border-blue-500"
                            placeholder="Misal 15000000"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors">Batal</button>
                          <button type="submit" className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors">Simpan</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col items-end gap-1 mt-1.5">
                        <p className="text-[10px] text-gray-400 font-medium">Target bulan ini: {formatRupiah(targetIncome)}</p>
                        <button onClick={() => setIsEditing(true)} className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                          <Edit2 className="w-2.5 h-2.5" /> Ubah Target
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-[400px] sm:h-80 w-full relative z-10">
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
                      <Line type="monotone" dataKey="cumIncome" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visits Chart */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8 mb-8 relative overflow-hidden group hover:border-blue-200 transition-colors duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" /> Progres Capaian Kunjungan
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">Total Kunjungan: {totalCumVisits} Orang</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-bold tracking-wide">Target {visitsPercent}% Tercapai</span>
                    </div>
                    {isEditing ? (
                      <form onSubmit={handleSaveTarget} className="mt-2 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">Target Kunjungan:</span>
                          <input 
                            type="number" 
                            value={editVisits}
                            onChange={(e) => setEditVisits(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-xs w-20 focus:outline-none focus:border-blue-500"
                            placeholder="Misal 150"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors">Batal</button>
                          <button type="submit" className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors">Simpan</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col items-end gap-1 mt-1.5">
                        <p className="text-[10px] text-gray-400 font-medium">Target bulan ini: {targetVisits} Orang</p>
                        <button onClick={() => setIsEditing(true)} className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                          <Edit2 className="w-2.5 h-2.5" /> Ubah Target
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-[400px] sm:h-80 w-full relative z-10">
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
                      <Line type="monotone" dataKey="cumVisits" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            )
          )}

          {/* AI Analysis Section */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-blue-50 rounded-[32px] p-6 md:p-8 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-500" /> Analisa Performa Bisnis AI
                </h3>
                <p className="text-blue-600/80 text-sm mt-1 font-medium">Dapatkan insight dan saran strategis berdasarkan performa bulan ini menggunakan Google Gemini AI.</p>
              </div>
              <button
                onClick={handleAnalyzeAI}
                disabled={aiLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-blue-100/50 relative z-10 overflow-auto shadow-sm">
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
