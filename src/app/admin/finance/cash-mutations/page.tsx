"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, MinusCircle, Wallet, ArrowLeft, ArrowUpRight, ArrowDownRight, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type CashMutation = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  date: string;
};

export default function CashMutationsPage() {
  const [mutations, setMutations] = useState<CashMutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [formData, setFormData] = useState({ amount: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchMutations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/cash-mutations");
      if (res.ok) {
        const json = await res.json();
        setMutations(json.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat mutasi kas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMutations();
  }, [fetchMutations]);

  const handleOpenModal = (type: "INCOME" | "EXPENSE") => {
    setModalType(type);
    setFormData({ amount: "", description: "" });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/finance/cash-mutations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: modalType,
          amount: formData.amount,
          description: formData.description,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Kas berhasil ${modalType === "INCOME" ? "ditambahkan" : "dikurangi"}!` });
        setTimeout(() => setIsModalOpen(false), 1200);
        fetchMutations();
      } else {
        const errJson = await res.json();
        setMessage({ type: "error", text: errJson.error || "Gagal mencatat mutasi" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSaving(false);
    }
  };

  const totalAdded = mutations
    .filter(m => m.type === "INCOME")
    .reduce((sum, m) => sum + m.amount, 0);

  const totalDeducted = mutations
    .filter(m => m.type === "EXPENSE")
    .reduce((sum, m) => sum + m.amount, 0);

  const netCash = totalAdded - totalDeducted;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <PageHeader 
          title="Mutasi Kasir"
          description="Kelola saldo fisik kasir harian (tambah & kurang saldo)."
          icon={Wallet}
          rightContent={
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                id="btn-tambah-kas"
                onClick={() => handleOpenModal("INCOME")}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Tambah Kas (In)
              </button>
              <button
                id="btn-kurang-kas"
                onClick={() => handleOpenModal("EXPENSE")}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95 cursor-pointer text-sm"
              >
                <MinusCircle className="w-4 h-4" />
                Kurang Kas (Out)
              </button>
            </div>
          }
        />

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Penambahan (In)</p>
              <h4 className="text-xl font-black text-gray-900 mt-1">{formatRupiah(totalAdded)}</h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Pengurangan (Out)</p>
              <h4 className="text-xl font-black text-gray-900 mt-1">{formatRupiah(totalDeducted)}</h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${netCash >= 0 ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-600"}`}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Saldo Bersih Mutasi</p>
              <h4 className={`text-xl font-black mt-1 ${netCash >= 0 ? "text-teal-600" : "text-red-600"}`}>{formatRupiah(netCash)}</h4>
            </div>
          </div>
        </div>

        {/* History Table Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              Riwayat Mutasi Saldo Kasir
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Waktu & Tanggal</th>
                  <th className="px-6 py-4 font-bold text-center">Jenis Mutasi</th>
                  <th className="px-6 py-4 font-bold text-right">Jumlah (Rupiah)</th>
                  <th className="px-6 py-4 font-bold w-1/2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Sedang memuat data mutasi...
                      </div>
                    </td>
                  </tr>
                ) : mutations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Wallet className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">Belum ada riwayat mutasi kasir</p>
                      <p className="text-sm text-gray-400 mt-1">Mutasi manual kas masuk/keluar akan terdaftar di sini.</p>
                    </td>
                  </tr>
                ) : (
                  mutations.map((m) => (
                    <tr key={m.id} className="hover:bg-emerald-50/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{new Date(m.date).toLocaleDateString("id-ID", { dateStyle: "medium" })}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(m.date).toLocaleTimeString("id-ID", { timeStyle: "short" })}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {m.type === "INCOME" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            Kas Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            Kas Keluar
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-right font-extrabold ${m.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {m.type === "INCOME" ? "+" : "-"}{formatRupiah(m.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-normal line-clamp-2 max-w-lg" title={m.description}>
                        {m.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mutation Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800">
                  Catat {modalType === "INCOME" ? "Tambah Kas (In)" : "Kurang Kas (Out)"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="p-6 space-y-4">
                  
                  {message && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                      {message.type === "success" ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                      <span className="text-sm font-semibold">{message.text}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Jumlah Kas (Rupiah)</label>
                    <input
                      id="mutation-amount-input"
                      type="number"
                      required
                      min="1"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Misal: 50000"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Keterangan / Alasan</label>
                    <textarea
                      id="mutation-description-input"
                      required
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Uraikan perihal kas masuk/keluar ini secara detail..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    id="submit-mutation-btn"
                    type="submit"
                    disabled={saving}
                    className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm ${modalType === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    {saving ? "Menyimpan..." : "Simpan Mutasi"}
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
