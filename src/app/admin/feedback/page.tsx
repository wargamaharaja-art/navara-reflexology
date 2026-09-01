"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Sparkles,
  Heart,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Flag,
  Trash2,
  Eye,
  MessageSquare,
  QrCode,
  Calendar,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  X,
  Send,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type FeedbackItem = {
  id: string;
  token: string;
  branchId: string;
  branchName: string | null;
  branchBrand: string | null;
  therapistId: string | null;
  therapistName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  isAnonymous: boolean;
  overallRating: number | null;
  therapistRating: number | null;
  facilityRating: number | null;
  serviceRating: number | null;
  valueRating: number | null;
  comment: string | null;
  aspectRatings: Record<string, number> | null;
  wouldRecommend: boolean | null;
  status: "PENDING" | "SUBMITTED" | "FLAGGED";
  submittedAt: string | null;
  createdAt: string;
};

type SummaryData = {
  totalCount: number;
  submittedCount: number;
  pendingCount: number;
  avgOverall: number;
  avgTherapist: number;
  avgFacility: number;
  avgService: number;
  avgValue: number;
  recommendRate: number;
  recommendCount: number;
  starDistribution: { star: number; count: number; percentage: number }[];
  therapistRanking: { id: string; name: string; reviewCount: number; averageRating: number }[];
  aspectAverages: { key: string; label: string; average: number; count: number }[];
  trendData: { date: string; count: number; avgRating: number }[];
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedTherapist, setSelectedTherapist] = useState("ALL");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [detailFeedback, setDetailFeedback] = useState<FeedbackItem | null>(null);
  const [qrModalItem, setQrModalItem] = useState<{ token: string; name: string; url: string } | null>(null);

  // Generate Link Form State
  const [genBranchId, setGenBranchId] = useState("");
  const [genTherapistId, setGenTherapistId] = useState("");
  const [genCustomerName, setGenCustomerName] = useState("");
  const [genCustomerPhone, setGenCustomerPhone] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ token: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load Initial Metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, tRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/therapists"),
        ]);
        if (bRes.ok) {
          const bJson = await bRes.json();
          setBranches(bJson.data || []);
          if (bJson.data?.length > 0) {
            setGenBranchId(bJson.data[0].id);
          }
        }
        if (tRes.ok) {
          const tJson = await tRes.json();
          setTherapists(tJson.data || []);
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Feedbacks and Summary
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch !== "ALL") params.append("branchId", selectedBranch);
      if (selectedTherapist !== "ALL") params.append("therapistId", selectedTherapist);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedRating !== "ALL") {
        if (selectedRating === "LOW") {
          params.append("maxRating", "3");
        } else {
          params.append("minRating", selectedRating);
          params.append("maxRating", selectedRating);
        }
      }
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchQuery) params.append("search", searchQuery);

      const [feedbacksRes, summaryRes] = await Promise.all([
        fetch(`/api/feedback?${params.toString()}`),
        fetch(`/api/feedback/summary?${params.toString()}`),
      ]);

      if (feedbacksRes.ok) {
        const fJson = await feedbacksRes.json();
        setFeedbacks(fJson.data || []);
      }
      if (summaryRes.ok) {
        const sJson = await summaryRes.json();
        setSummary(sJson.summary || null);
      }
    } catch (err) {
      console.error("Failed to load feedbacks", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedTherapist, selectedRating, selectedStatus, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Generate Link Action
  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genBranchId) {
      alert("Silakan pilih cabang terlebih dahulu.");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch("/api/feedback/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: genBranchId,
          therapistId: genTherapistId || null,
          customerName: genCustomerName || null,
          customerPhone: genCustomerPhone || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setGeneratedResult({
          token: json.token,
          url: `${window.location.origin}${json.url}`,
        });
        fetchData();
      } else {
        alert(json.error || "Gagal membuat link feedback");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setGenerating(false);
    }
  };

  // Flag/Resolve Action
  const handleToggleFlag = async (item: FeedbackItem) => {
    const newStatus = item.status === "FLAGGED" ? "SUBMITTED" : "FLAGGED";
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });
      if (res.ok) {
        setFeedbacks(prev =>
          prev.map(f => (f.id === item.id ? { ...f, status: newStatus } : f))
        );
        if (detailFeedback && detailFeedback.id === item.id) {
          setDetailFeedback({ ...detailFeedback, status: newStatus });
        }
      }
    } catch (err) {
      alert("Gagal mengubah status feedback");
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan feedback ini?")) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        if (detailFeedback?.id === id) setDetailFeedback(null);
      } else {
        alert("Gagal menghapus feedback");
      }
    } catch (err) {
      alert("Terjadi kesalahan");
    }
  };

  // Export to Excel (XLSX)
  const handleExportExcel = () => {
    if (feedbacks.length === 0) {
      alert("Tidak ada data feedback untuk diekspor");
      return;
    }

    const rows = feedbacks.map((f, idx) => ({
      No: idx + 1,
      Tanggal: f.submittedAt
        ? new Date(f.submittedAt).toLocaleDateString("id-ID")
        : new Date(f.createdAt).toLocaleDateString("id-ID"),
      Cabang: f.branchName || "-",
      "Nama Pelanggan": f.isAnonymous ? "Anonim" : f.customerName || "-",
      "No. Telepon": f.isAnonymous ? "-" : f.customerPhone || "-",
      Terapis: f.therapistName || "-",
      "Rating Keseluruhan": f.overallRating || "-",
      "Rating Terapis": f.therapistRating || "-",
      "Rating Fasilitas": f.facilityRating || "-",
      "Rating Pelayanan": f.serviceRating || "-",
      "Rating Kesesuaian Harga": f.valueRating || "-",
      "Rekomendasi (NPS)": f.wouldRecommend === true ? "Ya" : f.wouldRecommend === false ? "Tidak" : "-",
      Status: f.status,
      "Komentar / Saran": f.comment || "-",
      "Token URL": f.token,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback Pelanggan");
    XLSX.writeFile(wb, `Feedback-Pelanggan-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Feedback & Kepuasan Pelanggan"
        description="Pantau ulasan pelanggan, evaluasi performa terapis, dan tingkatkan kenyamanan klinik."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-4 h-4 text-slate-500" /> Ekspor Excel
            </button>
            <button
              onClick={() => {
                setGeneratedResult(null);
                setGenCustomerName("");
                setGenCustomerPhone("");
                setGenTherapistId("");
                setIsGenerateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Link Feedback
            </button>
          </div>
        }
      />

      {/* KPI SUMMARY CARDS */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Overall Rating */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rating Keseluruhan</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{summary.avgOverall || "0.0"}</span>
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>Dari <strong>{summary.submittedCount}</strong> ulasan masuk</span>
            </div>
          </div>

          {/* Card 2: Therapist Rating */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kinerja Terapis</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{summary.avgTherapist || "0.0"}</span>
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>Fasilitas: <strong>{summary.avgFacility || "0.0"} ⭐</strong></span>
            </div>
          </div>

          {/* Card 3: Recommendation (NPS) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tingkat Rekomendasi</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <ThumbsUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{summary.recommendRate}%</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              <span>Pelanggan merekomendasikan ke teman</span>
            </div>
          </div>

          {/* Card 4: Total & Pending */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Link Dibuat</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{summary.totalCount}</span>
              <span className="text-xs font-semibold text-slate-400">tautan</span>
            </div>
            <div className="mt-2 text-xs text-amber-600 font-semibold flex items-center gap-1">
              <span>{summary.pendingCount} menunggu diisi</span>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS SECTION (CHARTS & LEADERBOARD) */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Tren Rating & Jumlah Ulasan</h3>
                <p className="text-xs text-slate-400">Perkembangan rating harian pelanggan</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Rating Rata-rata
                </span>
              </div>
            </div>
            <div className="h-[220px] w-full">
              {summary.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="avgRating" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada tren ulasan yang cukup untuk ditampilkan
                </div>
              )}
            </div>
          </div>

          {/* Star Distribution & Top Therapists */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 mb-1">Distribusi Bintang</h3>
              <p className="text-xs text-slate-400 mb-4">Persentase kepuasan pelanggan</p>

              <div className="space-y-2 mb-6">
                {summary.starDistribution.slice().reverse().map(item => (
                  <div key={item.star} className="flex items-center gap-2 text-xs">
                    <span className="w-12 font-bold text-slate-600 flex items-center gap-1">
                      {item.star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-semibold text-slate-500">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Therapist Mini Leaderboard */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Peringkat Terapis Teratas</h4>
              {summary.therapistRanking.length > 0 ? (
                <div className="space-y-2">
                  {summary.therapistRanking.slice(0, 3).map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{t.averageRating}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({t.reviewCount})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">Belum ada data ulasan terapis</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Branch Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cabang</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Therapist Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Terapis</label>
            <select
              value={selectedTherapist}
              onChange={(e) => setSelectedTherapist(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Terapis</option>
              {therapists.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Rating</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
              <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
              <option value="LOW">⚠️ ≤ 3 Bintang (Perlu Evaluasi)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUBMITTED">Terkirim</option>
              <option value="PENDING">Menunggu Diisi</option>
              <option value="FLAGGED">🚩 Ditandai (Flagged)</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Search Bar & Reset */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama pelanggan, no. telepon, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
          >
            Cari
          </button>
          {(selectedBranch !== "ALL" || selectedTherapist !== "ALL" || selectedRating !== "ALL" || selectedStatus !== "ALL" || startDate || endDate || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBranch("ALL");
                setSelectedTherapist("ALL");
                setSelectedRating("ALL");
                setSelectedStatus("ALL");
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
              }}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              Reset Filter
            </button>
          )}
        </form>
      </div>

      {/* FEEDBACK LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Daftar Ulasan & Masukan Pelanggan ({feedbacks.length})
          </h3>
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Muat Ulang
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-xs font-medium">Memuat data feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Belum ada feedback yang cocok dengan filter</p>
            <p className="text-xs text-slate-400 mt-1">Buat link baru atau ubah kriteria pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Pelanggan</th>
                  <th className="py-3.5 px-4">Cabang & Terapis</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4">Komentar / Saran</th>
                  <th className="py-3.5 px-4 text-center">Rekomendasi</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Customer & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {item.isAnonymous ? (
                          <span className="text-slate-400 italic">Anonim 👤</span>
                        ) : (
                          item.customerName || "Pelanggan Tanpa Nama"
                        )}
                      </div>
                      {item.customerPhone && !item.isAnonymous && (
                        <div className="text-[11px] text-slate-400">{item.customerPhone}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : new Date(item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + " (Belum diisi)"}
                      </div>
                    </td>

                    {/* Branch & Therapist */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{item.branchName || "-"}</div>
                      {item.therapistName ? (
                        <div className="text-[11px] text-emerald-700 font-medium">Terapis: {item.therapistName}</div>
                      ) : (
                        <div className="text-[11px] text-slate-400">-</div>
                      )}
                    </td>

                    {/* Ratings */}
                    <td className="py-3.5 px-4 text-center">
                      {item.overallRating ? (
                        <div className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.overallRating}.0</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Comments */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {item.comment ? (
                        <p className="text-slate-700 text-xs line-clamp-2 italic">"{item.comment}"</p>
                      ) : (
                        <span className="text-slate-300 text-[11px]">- Tidak ada catatan -</span>
                      )}
                    </td>

                    {/* Would Recommend */}
                    <td className="py-3.5 px-4 text-center">
                      {item.wouldRecommend === true ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <ThumbsUp className="w-3 h-3" /> Ya
                        </span>
                      ) : item.wouldRecommend === false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                          <ThumbsDown className="w-3 h-3" /> Tidak
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {item.status === "SUBMITTED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Terkirim
                        </span>
                      ) : item.status === "FLAGGED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 flex items-center justify-center gap-1">
                          <Flag className="w-3 h-3 fill-red-600" /> Ditandai
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Menunggu
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail Button */}
                        <button
                          onClick={() => setDetailFeedback(item)}
                          title="Lihat Detail"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* QR Code / Share Button */}
                        <button
                          onClick={() =>
                            setQrModalItem({
                              token: item.token,
                              name: item.customerName || item.branchName || "Pelanggan",
                              url: `${window.location.origin}/feedback/${item.token}`,
                            })
                          }
                          title="Lihat QR Code / Salin Link"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Toggle Flag Button */}
                        <button
                          onClick={() => handleToggleFlag(item)}
                          title={item.status === "FLAGGED" ? "Hapus Tanda Flag" : "Tandai untuk Follow Up"}
                          className={`p-1.5 rounded-lg transition ${
                            item.status === "FLAGGED"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "hover:bg-slate-100 text-slate-400 hover:text-red-500"
                          }`}
                        >
                          <Flag className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Feedback"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: GENERATE LINK & QR CODE */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Buat Tautan Feedback Pelanggan</h3>
                <p className="text-xs text-slate-400">Generate link atau QR Code untuk dibagikan ke pelanggan</p>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedResult ? (
              <form onSubmit={handleGenerateLink} className="space-y-4 py-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cabang Klinik *</label>
                  <select
                    value={genBranchId}
                    onChange={(e) => setGenBranchId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Terapis Terkait (Opsional)</label>
                  <select
                    value={genTherapistId}
                    onChange={(e) => setGenTherapistId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Tanpa Terapis Tertentu --</option>
                    {therapists.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pasien (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Bpk. Ahmad"
                      value={genCustomerName}
                      onChange={(e) => setGenCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp (Opsional)</label>
                    <input
                      type="tel"
                      placeholder="Contoh: 08123456789"
                      value={genCustomerPhone}
                      onChange={(e) => setGenCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat Link...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Generate Tautan Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Tautan Feedback Siap Digunakan!</h4>
                  <p className="text-xs text-slate-400">Bagikan link atau tunjukkan QR Code kepada pelanggan</p>
                </div>

                {/* QR Display */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl inline-block shadow-inner mx-auto">
                  <QRCodeSVG value={generatedResult.url} size={150} />
                </div>

                {/* Copy Box */}
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-2 text-left">
                  <input
                    type="text"
                    readOnly
                    value={generatedResult.url}
                    className="bg-transparent border-none text-xs text-slate-700 flex-1 px-2 font-mono outline-none truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedResult.url)}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>

                {/* Direct WhatsApp Share button if phone was provided */}
                {genCustomerPhone && (
                  <a
                    href={`https://wa.me/${genCustomerPhone.replace(/^0/, "62").replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Assalamualaikum ${genCustomerName || "Bapak/Ibu"} 🙏\n\nTerima kasih telah berkunjung ke Navara Reflexology. Mohon luangkan 1 menit untuk mengisi feedback layanan kami di tautan berikut:\n👉 ${generatedResult.url}\n\nTerima kasih dan semoga sehat selalu!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" /> Kirim Undangan via WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setGeneratedResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  ← Buat Link Lainnya
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL VIEW */}
      {detailFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Detail Ulasan Pelanggan</h3>
                <p className="text-xs text-slate-400">
                  {detailFeedback.isAnonymous ? "Anonim" : detailFeedback.customerName || "Pelanggan"} • Cabang {detailFeedback.branchName}
                </p>
              </div>
              <button
                onClick={() => setDetailFeedback(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Overall Banner */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Rating Keseluruhan</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= (detailFeedback.overallRating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600">{detailFeedback.overallRating || 0}.0</span>
                  <span className="text-xs text-amber-700 font-semibold block">/ 5.0</span>
                </div>
              </div>

              {/* Specific Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Kinerja Terapis</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {detailFeedback.therapistRating || "-"} / 5
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Fasilitas & Kebersihan</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {detailFeedback.facilityRating || "-"} / 5
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Pelayanan Staff</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {detailFeedback.serviceRating || "-"} / 5
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Kesesuaian Harga</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {detailFeedback.valueRating || "-"} / 5
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Komentar & Masukan
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  {detailFeedback.comment ? `"${detailFeedback.comment}"` : "Tidak ada komentar tertulis."}
                </p>
              </div>

              {/* Actions in Modal */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleToggleFlag(detailFeedback)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    detailFeedback.status === "FLAGGED"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{detailFeedback.status === "FLAGGED" ? "Hapus Flag" : "Tandai untuk Follow Up"}</span>
                </button>

                <a
                  href={`/feedback/${detailFeedback.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Buka Form Pelanggan <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QR CODE POPUP */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-end">
              <button
                onClick={() => setQrModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 text-base">QR Code Form Feedback</h4>
            <p className="text-xs text-slate-400">{qrModalItem.name}</p>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl inline-block mx-auto shadow-inner">
              <QRCodeSVG value={qrModalItem.url} size={180} />
            </div>

            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-2 text-left">
              <input
                type="text"
                readOnly
                value={qrModalItem.url}
                className="bg-transparent border-none text-xs text-slate-700 flex-1 px-2 font-mono outline-none truncate"
              />
              <button
                onClick={() => copyToClipboard(qrModalItem.url)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin" : "Salin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
