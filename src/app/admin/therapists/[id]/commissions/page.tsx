"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Award, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

type CommissionRow = {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  commissionAmount: number | null;
  overrideId: string | null;
};

type Therapist = {
  id: string;
  name: string;
  specialization: string;
  commissionRate: number; // Flat base commission rate
};

export default function TherapistCommissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: therapistId } = use(params);

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [resTherapist, resCommissions] = await Promise.all([
        fetch(`/api/therapists/${therapistId}`),
        fetch(`/api/therapist-service-commissions?therapistId=${therapistId}`)
      ]);

      if (resTherapist.ok) {
        setTherapist(await resTherapist.json());
      } else {
        setMessage({ type: "error", text: "Terapis tidak ditemukan" });
      }

      if (resCommissions.ok) {
        const json = await resCommissions.json();
        setRows(json.data || []);
      } else {
        setMessage({ type: "error", text: "Gagal memuat daftar komisi khusus" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan memuat data" });
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAmountChange = (serviceId: string, val: string) => {
    setRows(prev =>
      prev.map(r => {
        if (r.serviceId === serviceId) {
          const num = val === "" ? null : parseInt(val);
          return { ...r, commissionAmount: num };
        }
        return r;
      })
    );
  };

  const handleSaveRow = async (row: CommissionRow) => {
    if (row.commissionAmount === null) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/therapist-service-commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId,
          serviceId: row.serviceId,
          commissionAmount: row.commissionAmount,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Komisi khusus untuk ${row.serviceName} berhasil disimpan!` });
        fetchData();
      } else {
        setMessage({ type: "error", text: "Gagal menyimpan komisi khusus" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string, serviceName: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/therapist-service-commissions/${overrideId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Komisi khusus untuk ${serviceName} berhasil dihapus (kembali ke default).` });
        fetchData();
      } else {
        setMessage({ type: "error", text: "Gagal menghapus komisi khusus" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Save all non-null commissions
      const promises = rows
        .filter(r => r.commissionAmount !== null)
        .map(r =>
          fetch("/api/therapist-service-commissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              therapistId,
              serviceId: r.serviceId,
              commissionAmount: r.commissionAmount,
            }),
          })
        );

      await Promise.all(promises);
      setMessage({ type: "success", text: "Semua setelan komisi berhasil disimpan!" });
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal menyimpan beberapa setelan komisi" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation back */}
        <button
          onClick={() => router.push("/admin/therapists")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-semibold mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar Terapis
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-xl shadow-md text-white">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Atur Komisi Khusus</h2>
              <p className="text-gray-500 mt-1">
                Terapis: <span className="font-bold text-gray-800">{therapist?.name || "Memuat..."}</span> ({therapist?.specialization})
              </p>
            </div>
          </div>
          {therapist && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-2 text-right">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Komisi Flat Default</p>
              <p className="text-lg font-black text-indigo-700">{formatRupiah(therapist.commissionRate)}</p>
            </div>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {message.type === "success" ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {/* Commission Rows Table Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Layanan Terapi</th>
                  <th className="px-6 py-4 font-bold text-right">Harga Layanan</th>
                  <th className="px-6 py-4 font-bold text-center">Komisi Khusus (Rupiah)</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi Baris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Sedang memuat data komisi...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                      Belum ada layanan aktif yang terdaftar di database.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.serviceId} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {row.serviceName}
                        {row.overrideId && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-purple-50 text-purple-700 border border-purple-200">
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                        {formatRupiah(row.servicePrice)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <input
                            id={`commission-amount-input-${row.serviceId}`}
                            type="number"
                            placeholder="Gunakan default"
                            value={row.commissionAmount !== null ? row.commissionAmount : ""}
                            onChange={(e) => handleAmountChange(row.serviceId, e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold outline-none w-36 text-center transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            id={`save-commission-row-btn-${row.serviceId}`}
                            onClick={() => handleSaveRow(row)}
                            disabled={row.commissionAmount === null || saving}
                            className="bg-indigo-55 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Simpan Baris
                          </button>
                          {row.overrideId && (
                            <button
                              id={`delete-commission-row-btn-${row.serviceId}`}
                              onClick={() => handleDeleteOverride(row.overrideId!, row.serviceName)}
                              disabled={saving}
                              className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Hapus kustom komisi, gunakan flat default"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Action Panel */}
        {!loading && rows.length > 0 && (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push("/admin/therapists")}
              className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors bg-white cursor-pointer"
            >
              Batalkan
            </button>
            <button
              id="save-all-commissions-btn"
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all cursor-pointer"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Menyimpan..." : "Simpan Semua Kustom"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
