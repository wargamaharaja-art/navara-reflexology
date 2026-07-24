"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Save, RefreshCw, Award, CheckCircle, AlertCircle, Users, Settings2, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type Service = {
  id: string;
  name: string;
  price: number;
};

type GlobalCommissionRow = {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  commissionAmount: number | null;
  isUniform: boolean;
  activeCount: number;
  isModified: boolean; // Tracks if the row has been edited but not saved
};

function TherapistCommissionsContent() {
  const router = useRouter();

  const [rows, setRows] = useState<GlobalCommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [totalActiveTherapists, setTotalActiveTherapists] = useState<number>(0);
  
  const [session, setSession] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState("ALL");

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
      const [resServices, resSync, branchRes, sessionRes] = await Promise.all([
        fetch(`/api/services?all=true`),
        fetch(`/api/therapist-service-commissions/sync-all?branchId=${filterBranch}&t=${Date.now()}`),
        fetch("/api/branches"),
        fetch("/api/auth/session")
      ]);

      let servicesData: Service[] = [];
      if (resServices.ok) {
        const json = await resServices.json();
        servicesData = json.data || [];
      }

      let syncData: any = {};
      if (resSync.ok) {
        const json = await resSync.json();
        syncData = json.globalCommissions || {};
        setTotalActiveTherapists(json.totalActiveTherapists || 0);
      }
      
      if (branchRes.ok) {
        const bJson = await branchRes.json();
        setBranches(bJson.data || []);
      }
      
      if (sessionRes.ok) {
        const sJson = await sessionRes.json();
        setSession(sJson.session);
      }

      const combinedRows: GlobalCommissionRow[] = servicesData.map(s => {
        const syncStatus = syncData[s.id] || { amount: null, isUniform: false, activeCount: 0 };
        return {
          serviceId: s.id,
          serviceName: s.name,
          servicePrice: s.price,
          commissionAmount: syncStatus.amount,
          isUniform: syncStatus.isUniform,
          activeCount: syncStatus.activeCount,
          isModified: false,
        };
      });

      setRows(combinedRows);

    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan memuat data sinkronisasi komisi." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterBranch]);

  const handleAmountChange = (serviceId: string, val: string) => {
    setRows(prev =>
      prev.map(r => {
        if (r.serviceId === serviceId) {
          const num = val === "" ? null : parseInt(val);
          return { ...r, commissionAmount: num, isModified: true };
        }
        return r;
      })
    );
  };

  const handleSaveRow = async (row: GlobalCommissionRow) => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        syncItems: [
          { serviceId: row.serviceId, commissionAmount: row.commissionAmount }
        ],
        branchId: filterBranch === "ALL" ? null : filterBranch
      };

      const res = await fetch("/api/therapist-service-commissions/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Komisi untuk ${row.serviceName} berhasil disinkronkan ke seluruh terapis!` });
        fetchData();
      } else {
        setMessage({ type: "error", text: "Gagal menyinkronkan komisi." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSaving(false);
    }
  };
  
  const handleResetRow = async (row: GlobalCommissionRow) => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        syncItems: [
          { serviceId: row.serviceId, commissionAmount: null } // null akan mereset ke komisi 0
        ],
        branchId: filterBranch === "ALL" ? null : filterBranch
      };

      const res = await fetch("/api/therapist-service-commissions/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Komisi kustom untuk ${row.serviceName} berhasil dihapus dari seluruh terapis.` });
        fetchData();
      } else {
        setMessage({ type: "error", text: "Gagal mereset komisi." });
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
      const itemsToSync = rows
        .filter(r => r.isModified)
        .map(r => ({ serviceId: r.serviceId, commissionAmount: r.commissionAmount }));

      if (itemsToSync.length === 0) {
         setMessage({ type: "success", text: "Tidak ada perubahan yang perlu disimpan." });
         setSaving(false);
         return;
      }

      const res = await fetch("/api/therapist-service-commissions/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          syncItems: itemsToSync,
          branchId: filterBranch === "ALL" ? null : filterBranch
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Semua perubahan komisi berhasil disinkronkan!" });
        fetchData();
      } else {
        setMessage({ type: "error", text: "Gagal menyinkronkan beberapa setelan komisi." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan saat menyinkronkan." });
    } finally {
      setSaving(false);
    }
  };

  const hasModifiedRows = rows.some(r => r.isModified);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <PageHeader 
          title="Sinkronisasi Komisi Layanan"
          description="Atur satu nominal komisi khusus pada layanan dan terapkan langsung ke seluruh terapis aktif di klinik."
          icon={Settings2}
          rightContent={
            session?.role === "SUPER_ADMIN" && !loading && branches.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none cursor-pointer w-full sm:w-64 transition-all appearance-none pr-10 shadow-sm font-medium"
                >
                  <option value="ALL">Semua Cabang (Global)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>Khusus {b.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-bold text-[10px]">▼</div>
              </div>
            )
          }
        />

        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-8 flex justify-between items-center animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-emerald-600" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-gray-900">Total Terapis Aktif</h3>
               <p className="text-gray-600 text-sm">Sinkronisasi akan diterapkan pada {totalActiveTherapists} terapis ini secara massal.</p>
             </div>
          </div>
          <div className="text-center bg-white px-5 py-3 rounded-xl shadow-sm border border-emerald-50">
             <span className="text-3xl font-black text-emerald-600">{totalActiveTherapists}</span>
             <span className="text-sm font-semibold text-gray-500 block">Terapis</span>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {message.type === "success" ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative mb-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4 font-bold">Layanan Terapi</th>
                  <th className="px-6 py-4 font-bold text-right">Harga Layanan</th>
                  <th className="px-6 py-4 font-bold text-center">Komisi Global (Rupiah)</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi Baris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Sedang memuat data layanan...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                      Belum ada layanan aktif yang terdaftar di database.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.serviceId} className={`hover:bg-emerald-50/30 transition-colors group ${row.isModified ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {row.serviceName}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                        {formatRupiah(row.servicePrice)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <input
                            id={`commission-amount-input-${row.serviceId}`}
                            type="number"
                            placeholder={!row.isUniform && row.activeCount > 0 ? "Bervariasi" : "Tidak ada komisi (Rp 0)"}
                            value={row.commissionAmount !== null ? row.commissionAmount : ""}
                            onChange={(e) => handleAmountChange(row.serviceId, e.target.value)}
                            className={`px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold outline-none w-44 text-center transition-all ${row.isModified ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-gray-200'}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.activeCount === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-gray-100 text-gray-500 rounded-md">Tidak Diatur (Rp 0)</span>
                        ) : row.isUniform && row.activeCount === totalActiveTherapists ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-green-100 text-green-700 rounded-md">Tersinkronisasi</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-orange-100 text-orange-700 rounded-md">Bervariasi / Parsial</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex justify-center gap-2">
                          <button
                            id={`save-commission-row-btn-${row.serviceId}`}
                            onClick={() => handleSaveRow(row)}
                            disabled={!row.isModified || saving || row.commissionAmount === null}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border
                              ${row.isModified && row.commissionAmount !== null ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'}
                            `}
                          >
                            Simpan & Sinkronisasi
                          </button>
                          {row.activeCount > 0 && (
                            <button
                              id={`delete-commission-row-btn-${row.serviceId}`}
                              onClick={() => handleResetRow(row)}
                              disabled={saving}
                              className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 p-2 rounded-xl transition-colors cursor-pointer shadow-sm"
                              title="Hapus kustom komisi, kembali ke Rp 0 untuk SEMUA terapis"
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
          
          {!loading && rows.length > 0 && (
            <div className="flex justify-end gap-4 px-6 py-5 bg-gray-50/50 border-t border-gray-100 items-center">
              {hasModifiedRows && <span className="text-sm font-semibold text-amber-600 animate-pulse">Ada perubahan yang belum disimpan</span>}
              <button
                id="save-all-commissions-btn"
                onClick={handleSaveAll}
                disabled={saving || !hasModifiedRows}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all cursor-pointer"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {saving ? "Menyinkronkan..." : "Sinkronisasi Semua Perubahan"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TherapistCommissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat antarmuka...</div>}>
      <TherapistCommissionsContent />
    </Suspense>
  );
}
