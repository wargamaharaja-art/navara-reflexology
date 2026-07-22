"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Printer, CheckCircle, XCircle, Ban, RotateCcw,
  ArrowRightLeft, Calendar, User, MapPin, FileText, Clock
} from "lucide-react";

type MutationDetail = {
  id: string;
  mutationNumber: string;
  therapistId: string;
  fromBranchId: string | null;
  toBranchId: string;
  effectiveDate: string;
  reason: string;
  notes: string | null;
  status: "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXECUTED" | "REVERSED";
  requestedBy: string;
  requestedByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  rejectedReason: string | null;
  reversedBy: string | null;
  reversedByName: string | null;
  reversedAt: string | null;
  reversedReason: string | null;
  createdAt: string;
  updatedAt: string;
  therapist: {
    id: string;
    name: string;
    specialization: string;
    phone: string;
    gender: string;
    photoUrl: string | null;
  } | null;
  fromBranch: {
    id: string;
    name: string;
    address: string;
    phone: string;
  } | null;
  toBranch: {
    id: string;
    name: string;
    address: string;
    phone: string;
  } | null;
  company: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
  } | null;
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

export default function MutationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<MutationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reverseReason, setReverseReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resDetail, resSession] = await Promise.all([
          fetch(`/api/therapist-mutations/${id}`),
          fetch("/api/auth/session"),
        ]);
        if (resDetail.ok) {
          const d = await resDetail.json();
          setData(d.data);
        }
        if (resSession.ok) {
          const s = await resSession.json();
          setSession(s.session);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAction = async (action: string, body: object = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/therapist-mutations/${id}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok) {
        // Reload data
        const resDetail = await fetch(`/api/therapist-mutations/${id}`);
        if (resDetail.ok) {
          const detail = await resDetail.json();
          setData(detail.data);
        }
        setShowRejectModal(false);
        setShowReverseModal(false);
        setRejectReason("");
        setReverseReason("");
      } else {
        alert(d.error || "Gagal memproses aksi");
      }
    } catch (err) {
      alert("Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Surat mutasi tidak ditemukan</p>
        <Link href="/admin/therapists/mutations" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
          ← Kembali ke daftar
        </Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[data.status];

  return (
    <>
      {/* Screen view (hidden on print) */}
      <div className="print:hidden space-y-5 p-4 md:p-6">
        {/* Back + Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Link
            href="/admin/therapists/mutations"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Mutasi
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {(data.status === "APPROVED" || data.status === "EXECUTED") && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              >
                <Printer className="w-4 h-4" /> Cetak Surat
              </button>
            )}
            {data.status === "DRAFT" && session?.role === "SUPER_ADMIN" && (
              <button
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Setujui
              </button>
            )}
            {data.status === "DRAFT" && session?.role === "SUPER_ADMIN" && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Tolak
              </button>
            )}
            {data.status === "DRAFT" && (session?.role === "SUPER_ADMIN" || data.requestedBy === session?.id) && (
              <button
                onClick={() => handleAction("cancel")}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Batalkan
              </button>
            )}
            {data.status === "EXECUTED" && session?.role === "SUPER_ADMIN" && (
              <button
                onClick={() => setShowReverseModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> Reverse
              </button>
            )}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-gray-500">{data.mutationNumber}</p>
              <h1 className="text-xl font-extrabold text-gray-900 mt-0.5">Surat Mutasi Terapis</h1>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${sc.bg} ${sc.text}`}>
              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Therapist Info */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-blue-800 text-sm">Data Terapis</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-blue-500">Nama</p>
                  <p className="font-semibold text-gray-900">{data.therapist?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Spesialisasi</p>
                  <p className="font-semibold text-gray-900">{data.therapist?.specialization || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">No. Telepon</p>
                  <p className="font-semibold text-gray-900">{data.therapist?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Jenis Kelamin</p>
                  <p className="font-semibold text-gray-900">{data.therapist?.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
                </div>
              </div>
            </div>

            {/* Branch Transfer */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-600 text-sm">Cabang Asal</h3>
                </div>
                <p className="font-bold text-gray-900">{data.fromBranch?.name || "—"}</p>
                <p className="text-xs text-gray-500 mt-1">{data.fromBranch?.address || "—"}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-blue-700 text-sm">Cabang Tujuan</h3>
                </div>
                <p className="font-bold text-gray-900">{data.toBranch?.name || "—"}</p>
                <p className="text-xs text-gray-500 mt-1">{data.toBranch?.address || "—"}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">Tanggal Efektif</p>
                </div>
                <p className="font-bold text-gray-900">{formatDate(data.effectiveDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">Tanggal Pengajuan</p>
                </div>
                <p className="font-bold text-gray-900">{formatDateTime(data.createdAt)}</p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5">Alasan Mutasi</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.reason}</p>
              </div>
            </div>

            {data.notes && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Catatan Tambahan</p>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.notes}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-3">Riwayat Status</h3>
              <div className="space-y-3">
                <TimelineItem
                  label="Diajukan"
                  by={data.requestedByName}
                  at={formatDateTime(data.createdAt)}
                  color="blue"
                  active
                />
                {data.approvedAt && (
                  <TimelineItem
                    label="Disetujui"
                    by={data.approvedByName || "—"}
                    at={formatDateTime(data.approvedAt)}
                    color="emerald"
                    active
                  />
                )}
                {data.executedAt && (
                  <TimelineItem
                    label="Dieksekusi (Berlaku)"
                    by="Sistem Otomatis"
                    at={formatDateTime(data.executedAt)}
                    color="emerald"
                    active
                  />
                )}
                {data.status === "REJECTED" && (
                  <TimelineItem
                    label={`Ditolak — ${data.rejectedReason || ""}`}
                    by="Super Admin"
                    at={formatDateTime(data.updatedAt)}
                    color="red"
                    active
                  />
                )}
                {data.reversedAt && (
                  <TimelineItem
                    label={`Di-reverse — ${data.reversedReason || ""}`}
                    by={data.reversedByName || "—"}
                    at={formatDateTime(data.reversedAt)}
                    color="purple"
                    active
                  />
                )}
                {data.status === "CANCELLED" && (
                  <TimelineItem
                    label="Dibatalkan"
                    by={data.requestedByName}
                    at={formatDateTime(data.updatedAt)}
                    color="gray"
                    active
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print View (only visible on print) */}
      <div className="hidden print:block p-8 text-black bg-white" style={{ fontFamily: "'Times New Roman', serif" }}>
        {/* Letter Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{data.company?.companyName || "Radja Bekam Reflexology"}</h1>
          <p className="text-sm mt-1">{data.company?.address || ""}</p>
          <p className="text-sm">Telp: {data.company?.phone || ""} | Email: {data.company?.email || ""}</p>
        </div>

        {/* Letter Title */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold underline uppercase">Surat Mutasi</h2>
          <p className="text-sm mt-1">Nomor: {data.mutationNumber}</p>
        </div>

        {/* Letter Body */}
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Yang bertanda tangan di bawah ini, manajemen <strong>{data.company?.companyName || "Radja Bekam Reflexology"}</strong>, dengan ini menyatakan bahwa:</p>

          <table className="ml-8 text-sm">
            <tbody>
              <tr>
                <td className="pr-4 py-1 align-top">Nama</td>
                <td className="pr-2 py-1 align-top">:</td>
                <td className="py-1 font-semibold">{data.therapist?.name || "—"}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 align-top">Spesialisasi</td>
                <td className="pr-2 py-1 align-top">:</td>
                <td className="py-1">{data.therapist?.specialization || "—"}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 align-top">No. Telepon</td>
                <td className="pr-2 py-1 align-top">:</td>
                <td className="py-1">{data.therapist?.phone || "—"}</td>
              </tr>
            </tbody>
          </table>

          <p>
            Terhitung mulai tanggal <strong>{formatDate(data.effectiveDate)}</strong>, yang bersangkutan 
            dimutasikan dari <strong>{data.fromBranch?.name || "—"}</strong> ({data.fromBranch?.address || "—"}) ke <strong>{data.toBranch?.name || "—"}</strong> ({data.toBranch?.address || "—"}).
          </p>

          <p>Adapun alasan mutasi ini adalah: {data.reason}</p>

          {data.notes && <p>Catatan tambahan: {data.notes}</p>}

          <p>
            Demikian surat mutasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-16">
          <div className="text-center text-sm">
            <p>Diajukan oleh,</p>
            <div className="h-20" />
            <p className="font-bold underline">{data.requestedByName}</p>
            <p>Pengaju</p>
          </div>
          {data.approvedByName && (
            <div className="text-center text-sm">
              <p>Disetujui oleh,</p>
              <div className="h-20" />
              <p className="font-bold underline">{data.approvedByName}</p>
              <p>Penyetuju</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-4 border-t border-gray-400 text-xs text-gray-500 text-center">
          <p>Dokumen ini dicetak secara otomatis oleh sistem {data.company?.companyName || "Radja Bekam Reflexology"}</p>
          <p>Dicetak pada: {new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tolak Surat Mutasi?</h3>
              <p className="text-sm text-gray-500 mt-2">Surat <strong>{data.mutationNumber}</strong> akan ditolak.</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Alasan penolakan (min 10 karakter)..."
                className="w-full mt-4 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none text-left"
              />
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={() => handleAction("reject", { rejectedReason: rejectReason })}
                disabled={actionLoading || rejectReason.trim().length < 10}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-all shadow-md"
              >
                {actionLoading ? "Memproses..." : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setShowReverseModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reverse Mutasi?</h3>
              <p className="text-sm text-gray-500 mt-2">Terapis akan dikembalikan ke cabang asal.</p>
              <textarea
                value={reverseReason}
                onChange={e => setReverseReason(e.target.value)}
                rows={3}
                placeholder="Alasan reverse (min 10 karakter)..."
                className="w-full mt-4 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 resize-none text-left"
              />
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button onClick={() => setShowReverseModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={() => handleAction("reverse", { reversedReason: reverseReason })}
                disabled={actionLoading || reverseReason.trim().length < 10}
                className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md"
              >
                {actionLoading ? "Memproses..." : "Ya, Reverse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TimelineItem({ label, by, at, color, active }: {
  label: string;
  by: string;
  at: string;
  color: string;
  active: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    gray: "bg-gray-400",
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${active ? (colorMap[color] || "bg-gray-400") : "bg-gray-200"} shrink-0 mt-0.5`} />
        <div className="w-0.5 h-full bg-gray-200 min-h-[20px]" />
      </div>
      <div className="pb-3">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{by} — {at}</p>
      </div>
    </div>
  );
}
