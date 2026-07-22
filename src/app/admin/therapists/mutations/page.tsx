"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText, Plus, Search, Eye, CheckCircle, XCircle, X, Ban,
  ArrowRightLeft, Calendar, ChevronDown, RotateCcw, Filter
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";

type Mutation = {
  id: string;
  mutationNumber: string;
  therapistId: string;
  therapistName: string;
  therapistSpecialization: string;
  fromBranchId: string | null;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  effectiveDate: string;
  reason: string;
  notes: string | null;
  status: "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXECUTED" | "REVERSED";
  requestedBy: string;
  requestedByName: string;
  approvedByName: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  rejectedReason: string | null;
  reversedByName: string | null;
  reversedAt: string | null;
  reversedReason: string | null;
  createdAt: string;
};

type Stats = {
  draft: number;
  approved: number;
  executed: number;
  rejected: number;
  reversed: number;
};

type Therapist = {
  id: string;
  name: string;
  specialization: string;
  branchId: string | null;
  isActive: boolean;
};

type Branch = {
  id: string;
  name: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Session = any;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: "Draft", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  APPROVED: { label: "Disetujui", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  EXECUTED: { label: "Berlaku", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  REJECTED: { label: "Ditolak", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  CANCELLED: { label: "Dibatalkan", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  REVERSED: { label: "Di-reverse", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
};

export default function MutationsPage() {
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [stats, setStats] = useState<Stats>({ draft: 0, approved: 0, executed: 0, rejected: 0, reversed: 0 });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: "approve" | "reject" | "cancel" | "reverse";
    mutationId: string;
    mutationNumber: string;
  } | null>(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    therapistId: "",
    toBranchId: "",
    effectiveDate: "",
    reason: "",
    notes: "",
    autoApprove: false,
  });

  const fetchMutations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const res = await fetch(`/api/therapist-mutations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMutations(data.data || []);
        setStats(data.stats || { draft: 0, approved: 0, executed: 0, rejected: 0, reversed: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch mutations:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    const init = async () => {
      try {
        const [resSession, resBranches, resTherapists] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/branches"),
          fetch("/api/therapists"),
        ]);
        if (resSession.ok) {
          const d = await resSession.json();
          setSession(d.session);
        }
        if (resBranches.ok) {
          const d = await resBranches.json();
          setBranches(d.data || []);
        }
        if (resTherapists.ok) {
          const d = await resTherapists.json();
          setTherapists(d.filter((t: Therapist) => t.isActive));
        }
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchMutations();
  }, [fetchMutations]);

  // Cron: auto-execute mutations on page load
  useEffect(() => {
    fetch("/api/cron/execute-mutations").catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/cron/execute-mutations").catch(() => {});
    }, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Filter mutations by search
  const filteredMutations = mutations.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.mutationNumber.toLowerCase().includes(q) ||
      m.therapistName?.toLowerCase().includes(q) ||
      m.fromBranchName?.toLowerCase().includes(q) ||
      m.toBranchName?.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredMutations.length / itemsPerPage);
  const paginatedMutations = filteredMutations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selected therapist info for form
  const selectedTherapist = therapists.find(t => t.id === formData.therapistId);
  const fromBranch = selectedTherapist ? branches.find(b => b.id === selectedTherapist.branchId) : null;
  const availableBranches = branches.filter(b => b.id !== selectedTherapist?.branchId);

  const handleCreate = async () => {
    if (!formData.therapistId || !formData.toBranchId || !formData.effectiveDate || !formData.reason) {
      alert("Semua field wajib harus diisi");
      return;
    }
    if (formData.reason.trim().length < 10) {
      alert("Alasan mutasi minimal 10 karakter");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/therapist-mutations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFormOpen(false);
        setFormData({ therapistId: "", toBranchId: "", effectiveDate: "", reason: "", notes: "", autoApprove: false });
        fetchMutations();
      } else {
        alert(data.error || "Gagal membuat surat mutasi");
      }
    } catch (err) {
      alert("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;

    // Validate reason for reject/reverse
    if ((confirmModal.type === "reject" || confirmModal.type === "reverse") && confirmReason.trim().length < 10) {
      alert("Alasan wajib diisi (minimal 10 karakter)");
      return;
    }

    setConfirmLoading(true);
    try {
      const bodyMap: Record<string, object> = {
        reject: { rejectedReason: confirmReason },
        reverse: { reversedReason: confirmReason },
        approve: {},
        cancel: {},
      };

      const res = await fetch(`/api/therapist-mutations/${confirmModal.mutationId}/${confirmModal.type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyMap[confirmModal.type]),
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmModal(null);
        setConfirmReason("");
        fetchMutations();
      } else {
        alert(data.error || "Gagal memproses aksi");
      }
    } catch (err) {
      alert("Terjadi kesalahan");
    } finally {
      setConfirmLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="Surat Mutasi Terapis"
        description="Kelola perpindahan terapis antar cabang secara formal"
        icon={ArrowRightLeft}
        rightContent={
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Surat Mutasi</span>
            <span className="sm:hidden">Buat</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Draft", value: stats.draft, color: "amber" },
          { label: "Disetujui", value: stats.approved, color: "blue" },
          { label: "Berlaku", value: stats.executed, color: "emerald" },
          { label: "Ditolak", value: stats.rejected, color: "red" },
          { label: "Di-reverse", value: stats.reversed, color: "purple" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari no. surat, nama terapis, cabang..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Disetujui</option>
            <option value="EXECUTED">Berlaku</option>
            <option value="REJECTED">Ditolak</option>
            <option value="CANCELLED">Dibatalkan</option>
            <option value="REVERSED">Di-reverse</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMutations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada surat mutasi</p>
          <p className="text-gray-400 text-sm mt-1">Klik tombol &quot;Buat Surat Mutasi&quot; untuk membuat yang baru</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Surat</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Terapis</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Cabang Asal → Tujuan</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tgl Efektif</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Diajukan oleh</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedMutations.map(m => {
                  const sc = STATUS_CONFIG[m.status];
                  return (
                    <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-800">{m.mutationNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800">{m.therapistName}</p>
                        <p className="text-xs text-gray-400">{m.therapistSpecialization}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-gray-600">{m.fromBranchName}</span>
                          <span className="text-gray-300">→</span>
                          <span className="font-bold text-blue-600">{m.toBranchName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{formatDate(m.effectiveDate)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{m.requestedByName}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/admin/therapists/mutations/${m.id}`}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {m.status === "DRAFT" && session?.role === "SUPER_ADMIN" && (
                            <button
                              onClick={() => setConfirmModal({ type: "approve", mutationId: m.id, mutationNumber: m.mutationNumber })}
                              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                              title="Setujui"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {m.status === "DRAFT" && session?.role === "SUPER_ADMIN" && (
                            <button
                              onClick={() => setConfirmModal({ type: "reject", mutationId: m.id, mutationNumber: m.mutationNumber })}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                              title="Tolak"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {m.status === "DRAFT" && (session?.role === "SUPER_ADMIN" || m.requestedBy === session?.id) && (
                            <button
                              onClick={() => setConfirmModal({ type: "cancel", mutationId: m.id, mutationNumber: m.mutationNumber })}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                              title="Batalkan"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {m.status === "EXECUTED" && session?.role === "SUPER_ADMIN" && (
                            <button
                              onClick={() => setConfirmModal({ type: "reverse", mutationId: m.id, mutationNumber: m.mutationNumber })}
                              className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
                              title="Reverse / Rollback"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedMutations.map(m => {
              const sc = STATUS_CONFIG[m.status];
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-700">{m.mutationNumber}</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{m.therapistName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mb-2">
                    <span className="text-gray-500">{m.fromBranchName}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-bold text-blue-600">{m.toBranchName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Efektif: {formatDate(m.effectiveDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 border-t border-gray-50 pt-3">
                    <Link
                      href={`/admin/therapists/mutations/${m.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </Link>
                    {m.status === "DRAFT" && session?.role === "SUPER_ADMIN" && (
                      <button
                        onClick={() => setConfirmModal({ type: "approve", mutationId: m.id, mutationNumber: m.mutationNumber })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Setujui
                      </button>
                    )}
                    {m.status === "DRAFT" && (session?.role === "SUPER_ADMIN" || m.requestedBy === session?.id) && (
                      <button
                        onClick={() => setConfirmModal({ type: "cancel", mutationId: m.id, mutationNumber: m.mutationNumber })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 text-gray-500 text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" /> Batal
                      </button>
                    )}
                    {m.status === "EXECUTED" && session?.role === "SUPER_ADMIN" && (
                      <button
                        onClick={() => setConfirmModal({ type: "reverse", mutationId: m.id, mutationNumber: m.mutationNumber })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-50 text-purple-600 text-xs font-semibold hover:bg-purple-100 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reverse
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredMutations.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}

      {/* Create Mutation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Buat Surat Mutasi</h2>
                  <p className="text-xs text-gray-400">Pindahkan terapis ke cabang lain</p>
                </div>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Therapist Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Terapis <span className="text-red-500">*</span></label>
                <select
                  value={formData.therapistId}
                  onChange={e => setFormData(f => ({ ...f, therapistId: e.target.value, toBranchId: "" }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                >
                  <option value="">— Pilih Terapis —</option>
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.specialization}</option>
                  ))}
                </select>
              </div>

              {/* From Branch (readonly) */}
              {selectedTherapist && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cabang Asal</label>
                  <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600">
                    {fromBranch?.name || "Belum ditentukan"}
                  </div>
                </div>
              )}

              {/* To Branch */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cabang Tujuan <span className="text-red-500">*</span></label>
                <select
                  value={formData.toBranchId}
                  onChange={e => setFormData(f => ({ ...f, toBranchId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  disabled={!selectedTherapist}
                >
                  <option value="">— Pilih Cabang Tujuan —</option>
                  {availableBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Effective Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Efektif <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  min={todayStr}
                  onChange={e => setFormData(f => ({ ...f, effectiveDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alasan Mutasi <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Jelaskan alasan mutasi (minimal 10 karakter)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.reason.length}/10 karakter minimum</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan Tambahan</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Opsional..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                />
              </div>

              {/* Auto Approve (only for SUPER_ADMIN) */}
              {session?.role === "SUPER_ADMIN" && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.autoApprove}
                    onChange={e => setFormData(f => ({ ...f, autoApprove: e.target.checked }))}
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Langsung Setujui</p>
                    <p className="text-xs text-blue-500">Surat mutasi akan langsung berstatus APPROVED (tanpa tahap DRAFT)</p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
              >
                {saving ? "Menyimpan..." : "Buat Surat Mutasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setConfirmModal(null); setConfirmReason(""); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              {confirmModal.type === "approve" && (
                <>
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Setujui Surat Mutasi?</h3>
                  <p className="text-sm text-gray-500 mt-2">Surat <strong>{confirmModal.mutationNumber}</strong> akan disetujui dan berlaku pada tanggal efektif.</p>
                </>
              )}
              {confirmModal.type === "reject" && (
                <>
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-7 h-7 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Tolak Surat Mutasi?</h3>
                  <p className="text-sm text-gray-500 mt-2">Surat <strong>{confirmModal.mutationNumber}</strong> akan ditolak.</p>
                  <textarea
                    value={confirmReason}
                    onChange={e => setConfirmReason(e.target.value)}
                    rows={3}
                    placeholder="Alasan penolakan (min 10 karakter)..."
                    className="w-full mt-4 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none text-left"
                  />
                </>
              )}
              {confirmModal.type === "cancel" && (
                <>
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Ban className="w-7 h-7 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Batalkan Surat Mutasi?</h3>
                  <p className="text-sm text-gray-500 mt-2">Surat <strong>{confirmModal.mutationNumber}</strong> akan dibatalkan secara permanen.</p>
                </>
              )}
              {confirmModal.type === "reverse" && (
                <>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RotateCcw className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Reverse Mutasi?</h3>
                  <p className="text-sm text-gray-500 mt-2">Terapis akan dikembalikan ke cabang asal. Surat <strong>{confirmModal.mutationNumber}</strong> akan di-reverse.</p>
                  <textarea
                    value={confirmReason}
                    onChange={e => setConfirmReason(e.target.value)}
                    rows={3}
                    placeholder="Alasan reverse (min 10 karakter)..."
                    className="w-full mt-4 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 resize-none text-left"
                  />
                </>
              )}
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button
                onClick={() => { setConfirmModal(null); setConfirmReason(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all shadow-md ${
                  confirmModal.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" :
                  confirmModal.type === "reject" ? "bg-red-600 hover:bg-red-700" :
                  confirmModal.type === "reverse" ? "bg-purple-600 hover:bg-purple-700" :
                  "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {confirmLoading ? "Memproses..." :
                  confirmModal.type === "approve" ? "Ya, Setujui" :
                  confirmModal.type === "reject" ? "Ya, Tolak" :
                  confirmModal.type === "reverse" ? "Ya, Reverse" :
                  "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
