"use client";

import { useState, useEffect, Fragment } from "react";
import { ArrowLeft, BookOpen, Calculator, Calendar, DollarSign, FileText, PieChart as PieChartIcon, TrendingUp, TrendingDown, Layers } from "lucide-react";
import Link from "next/link";

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
};

export default function AccountingDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [month, setMonth] = useState(""); // "" means all time
  const [activeTab, setActiveTab] = useState<"ringkasan" | "jurnal" | "labarugi" | "neraca" | "aruskas">("ringkasan");

  const fetchAccounting = async () => {
    setLoading(true);
    try {
      const url = month ? `/api/finance/accounting?month=${month}` : "/api/finance/accounting";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounting();
  }, [month]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Link href="/admin/finance" className="bg-gray-100 p-2 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-teal-50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="bg-teal-100 p-3 rounded-2xl text-emerald-600">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Akuntansi & Buku Besar</h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1">Laporan Laba Rugi, Neraca, Arus Kas, dan Jurnal Umum standar Akuntansi.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            />
            {month && (
              <button onClick={() => setMonth("")} className="text-xs text-red-500 hover:underline">Reset</button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          {[
            { id: "ringkasan", label: "Ringkasan Finansial", icon: PieChartIcon },
            { id: "labarugi", label: "Laba/Rugi (Income Stmt)", icon: TrendingUp },
            { id: "neraca", label: "Neraca (Balance Sheet)", icon: Layers },
            { id: "aruskas", label: "Arus Kas (Cash Flow)", icon: DollarSign },
            { id: "jurnal", label: "Jurnal Umum", icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-teal-50 hover:text-emerald-600 border border-gray-200"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 min-h-[500px]">
          
          {/* TAB: RINGKASAN */}
          {activeTab === "ringkasan" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Laba Kotor</p>
                  <h3 className="text-2xl font-black text-emerald-900">{formatRupiah(m.grossProfit)}</h3>
                  <p className="text-emerald-600/70 text-xs mt-2">Pendapatan - HPP</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
                  <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">Laba Bersih</p>
                  <h3 className="text-2xl font-black text-teal-900">{formatRupiah(m.netIncome)}</h3>
                  <p className="text-teal-600/70 text-xs mt-2">Laba Kotor - Beban Operasional</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
                  <p className="text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">Total Aset</p>
                  <h3 className="text-2xl font-black text-purple-900">{formatRupiah(m.totalAssets)}</h3>
                  <p className="text-purple-600/70 text-xs mt-2">Kas + Persediaan + Aset Tetap</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">Arus Kas Bersih</p>
                  <h3 className="text-2xl font-black text-amber-900">{formatRupiah(m.netCashFlow)}</h3>
                  <p className="text-amber-600/70 text-xs mt-2">Kas Masuk - Kas Keluar</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5"/> Persamaan Dasar Akuntansi</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-sm md:text-base">
                  <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 text-center w-full md:w-auto">
                    <p className="text-gray-500 text-xs font-bold mb-1">ASET</p>
                    <p className="font-bold text-lg text-gray-900">{formatRupiah(m.totalAssets)}</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">=</div>
                  <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 text-center w-full md:w-auto">
                    <p className="text-gray-500 text-xs font-bold mb-1">KEWAJIBAN</p>
                    <p className="font-bold text-lg text-gray-900">{formatRupiah(m.totalLiabilities)}</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">+</div>
                  <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 text-center w-full md:w-auto">
                    <p className="text-gray-500 text-xs font-bold mb-1">MODAL (Inc. Laba)</p>
                    <p className="font-bold text-lg text-gray-900">{formatRupiah(m.totalEquity)}</p>
                  </div>
                </div>
                {m.totalAssets !== (m.totalLiabilities + m.totalEquity) && (
                  <p className="text-red-500 text-sm mt-4 text-center font-bold">⚠️ Warning: Neraca tidak seimbang (Unbalanced)</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: LABA RUGI */}
          {activeTab === "labarugi" && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">LAPORAN LABA RUGI</h2>
                <p className="text-gray-500">Periode: {month ? month : "Semua Waktu"}</p>
              </div>

              <div className="space-y-6 text-sm sm:text-base">
                {/* Pendapatan */}
                <div>
                  <h3 className="font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3">PENDAPATAN</h3>
                  {Object.values(data.balances).filter((a:any) => a.type === "REVENUE" && a.balance > 0).map((a:any, i) => (
                    <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-gray-50">
                      <span className="text-gray-600">{a.name}</span>
                      <span className="font-medium text-gray-900">{formatRupiah(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 px-2 mt-2 font-bold text-gray-900 bg-gray-50">
                    <span>Total Pendapatan</span>
                    <span>{formatRupiah(m.totalRevenue)}</span>
                  </div>
                </div>

                {/* HPP */}
                <div>
                  <h3 className="font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3">HARGA POKOK PENJUALAN (HPP)</h3>
                  {Object.values(data.balances).filter((a:any) => a.type === "COGS" && a.balance > 0).map((a:any, i) => (
                    <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-gray-50">
                      <span className="text-gray-600">{a.name}</span>
                      <span className="font-medium text-gray-900">{formatRupiah(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 px-2 mt-2 font-bold text-gray-900 bg-gray-50">
                    <span>Total HPP</span>
                    <span>{formatRupiah(m.totalCOGS)}</span>
                  </div>
                </div>

                {/* Laba Kotor */}
                <div className="flex justify-between py-4 px-4 bg-emerald-50 text-emerald-900 rounded-xl font-black text-lg">
                  <span>LABA KOTOR</span>
                  <span>{formatRupiah(m.grossProfit)}</span>
                </div>

                {/* Beban Operasional */}
                <div>
                  <h3 className="font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3">BEBAN OPERASIONAL</h3>
                  {Object.values(data.balances).filter((a:any) => a.type === "EXPENSE" && a.balance > 0).map((a:any, i) => (
                    <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-gray-50">
                      <span className="text-gray-600">{a.name}</span>
                      <span className="font-medium text-gray-900">{formatRupiah(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 px-2 mt-2 font-bold text-gray-900 bg-gray-50">
                    <span>Total Beban Operasional</span>
                    <span>{formatRupiah(m.totalExpense)}</span>
                  </div>
                </div>

                {/* Laba Bersih */}
                <div className="flex justify-between py-4 px-4 bg-teal-600 text-white rounded-xl font-black text-xl shadow-lg">
                  <span>LABA BERSIH</span>
                  <span>{formatRupiah(m.netIncome)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NERACA */}
          {activeTab === "neraca" && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">NERACA KEUANGAN (BALANCE SHEET)</h2>
                <p className="text-gray-500">Per: {new Date().toLocaleDateString('id-ID')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-sm sm:text-base">
                {/* KIRI: ASET */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-lg text-emerald-900 border-b-2 border-teal-200 pb-2 mb-4 bg-teal-50/50 px-2 pt-2 rounded-t-lg">ASET (AKTIVA)</h3>
                    {Object.values(data.balances).filter((a:any) => a.type === "ASSET" && a.balance !== 0).map((a:any, i) => (
                      <div key={i} className="flex justify-between py-2 px-2 border-b border-gray-100 hover:bg-gray-50">
                        <span className="text-gray-700">{a.name}</span>
                        <span className="font-semibold text-gray-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between py-4 px-4 bg-emerald-600 text-white rounded-xl font-black text-lg shadow-md">
                    <span>TOTAL ASET</span>
                    <span>{formatRupiah(m.totalAssets)}</span>
                  </div>
                </div>

                {/* KANAN: KEWAJIBAN & MODAL */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-lg text-rose-900 border-b-2 border-rose-200 pb-2 mb-4 bg-rose-50/50 px-2 pt-2 rounded-t-lg">KEWAJIBAN (LIABILITAS)</h3>
                    {Object.values(data.balances).filter((a:any) => a.type === "LIABILITY" && a.balance !== 0).map((a:any, i) => (
                      <div key={i} className="flex justify-between py-2 px-2 border-b border-gray-100 hover:bg-gray-50">
                        <span className="text-gray-700">{a.name}</span>
                        <span className="font-semibold text-gray-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 px-2 mt-2 font-bold text-gray-900 bg-gray-50">
                      <span>Total Kewajiban</span>
                      <span>{formatRupiah(m.totalLiabilities)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-emerald-900 border-b-2 border-emerald-200 pb-2 mb-4 bg-emerald-50/50 px-2 pt-2 rounded-t-lg">MODAL (EKUITAS)</h3>
                    {Object.values(data.balances).filter((a:any) => a.type === "EQUITY" && a.balance !== 0).map((a:any, i) => (
                      <div key={i} className="flex justify-between py-2 px-2 border-b border-gray-100 hover:bg-gray-50">
                        <span className="text-gray-700">{a.name}</span>
                        <span className="font-semibold text-gray-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                    {/* Add Net Income to Equity for Balance Sheet */}
                    <div className="flex justify-between py-2 px-2 border-b border-gray-100 hover:bg-gray-50 text-emerald-700">
                      <span className="font-medium">Laba Tahun Berjalan</span>
                      <span className="font-semibold">{formatRupiah(m.netIncome)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 px-2 mt-2 font-bold text-gray-900 bg-gray-50">
                      <span>Total Modal</span>
                      <span>{formatRupiah(m.totalEquity)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-4 px-4 bg-gray-800 text-white rounded-xl font-black text-lg shadow-md">
                    <span>TOTAL PASIVA</span>
                    <span>{formatRupiah(m.totalLiabilities + m.totalEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ARUS KAS */}
          {activeTab === "aruskas" && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">LAPORAN ARUS KAS (CASH FLOW)</h2>
                <p className="text-gray-500">Periode: {month ? month : "Semua Waktu"}</p>
              </div>

              <div className="space-y-6 text-sm sm:text-base">
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-200 p-2 rounded-full text-green-700"><TrendingUp className="w-5 h-5"/></div>
                    <h3 className="font-bold text-green-900 text-lg">Kas Masuk (Inflow)</h3>
                  </div>
                  <h2 className="text-3xl font-black text-green-700">{formatRupiah(m.cashFlowIn)}</h2>
                  <p className="text-green-600/70 text-sm mt-2">Seluruh debet pada akun Kas & Bank.</p>
                </div>

                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-rose-200 p-2 rounded-full text-rose-700"><TrendingDown className="w-5 h-5"/></div>
                    <h3 className="font-bold text-rose-900 text-lg">Kas Keluar (Outflow)</h3>
                  </div>
                  <h2 className="text-3xl font-black text-rose-700">{formatRupiah(m.cashFlowOut)}</h2>
                  <p className="text-rose-600/70 text-sm mt-2">Seluruh kredit pada akun Kas & Bank.</p>
                </div>

                <div className={`p-6 rounded-2xl border ${m.netCashFlow >= 0 ? "bg-emerald-600 border-emerald-700 text-white" : "bg-red-600 border-red-700 text-white"} shadow-xl`}>
                  <h3 className="font-bold text-white/80 text-lg mb-2">Kenaikan (Penurunan) Kas Bersih</h3>
                  <h2 className="text-4xl font-black">{formatRupiah(m.netCashFlow)}</h2>
                </div>
              </div>
            </div>
          )}

          {/* TAB: JURNAL */}
          {activeTab === "jurnal" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Jurnal Umum (Buku Harian)</h2>
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">50 Transaksi Terakhir</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Keterangan / Akun</th>
                      <th className="px-4 py-3 text-right">Debet (Rp)</th>
                      <th className="px-4 py-3 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.journals.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-500">Belum ada jurnal tercatat.</td></tr>
                    )}
                    {data.journals.map((j: any) => (
                      <Fragment key={j.id}>
                        <tr className="bg-gray-50/30">
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap align-top">
                            {new Date(j.date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-700">
                            {j.description}
                            <div className="text-xs text-gray-400 font-normal mt-1">Ref: {j.id.split('_')[1]}</div>
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3"></td>
                        </tr>
                        {/* Render Debit Lines First */}
                        {j.lines.filter((l:any) => l.debit > 0).map((l:any) => (
                          <tr key={l.id} className="bg-white hover:bg-gray-50">
                            <td></td>
                            <td className="px-4 py-2 text-gray-800">{l.accountName}</td>
                            <td className="px-4 py-2 text-right font-medium text-emerald-600">{l.debit.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-2 text-right text-gray-400">-</td>
                          </tr>
                        ))}
                        {/* Render Credit Lines */}
                        {j.lines.filter((l:any) => l.credit > 0).map((l:any) => (
                          <tr key={l.id} className="bg-white hover:bg-gray-50">
                            <td></td>
                            <td className="px-4 py-2 text-gray-600 pl-8 italic">{l.accountName}</td>
                            <td className="px-4 py-2 text-right text-gray-400">-</td>
                            <td className="px-4 py-2 text-right font-medium text-rose-600">{l.credit.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
