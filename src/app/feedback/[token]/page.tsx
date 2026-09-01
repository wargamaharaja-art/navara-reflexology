"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Star,
  Sparkles,
  Heart,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Building2,
  User,
  Activity,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  AlertCircle
} from "lucide-react";
import Image from "next/image";

type FeedbackData = {
  id: string;
  token: string;
  status: "PENDING" | "SUBMITTED" | "FLAGGED";
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
  submittedAt: string | null;
  branch: {
    id: string;
    name: string;
    brand: "RADJA_BEKAM" | "NAVARA";
    address: string;
    phone: string;
    whatsappNumber: string;
  } | null;
  therapist: {
    id: string;
    name: string;
    specialization: string;
    photoUrl: string | null;
  } | null;
  services: string[];
};

const RATING_LABELS: Record<number, string> = {
  1: "Sangat Kecewa 😞",
  2: "Kurang Puas 🙁",
  3: "Cukup Baik 😐",
  4: "Puas & Nyaman 😊",
  5: "Sangat Puas & Istimewa! 🌟",
};

export default function CustomerFeedbackPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<FeedbackData | null>(null);

  // Form states
  const [overallRating, setOverallRating] = useState<number>(5);
  const [therapistRating, setTherapistRating] = useState<number>(5);
  const [facilityRating, setFacilityRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [valueRating, setValueRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");

  // Detailed aspects
  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>({
    cleanliness: 5,
    friendliness: 5,
    punctuality: 5,
    comfort: 5,
    technique: 5,
  });

  useEffect(() => {
    async function loadFeedback() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/feedback/${token}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json.data);
          if (json.data.status === "SUBMITTED") {
            setSuccess(true);
          }
          if (json.data.customerName) {
            setCustomerName(json.data.customerName);
          }
        } else {
          setError(json.error || "Form feedback tidak ditemukan");
        }
      } catch (err: any) {
        setError("Gagal memuat form feedback. Silakan coba beberapa saat lagi.");
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overallRating) {
      alert("Mohon berikan rating keseluruhan terlebih dahulu.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating,
          therapistRating: data?.therapist ? therapistRating : null,
          facilityRating,
          serviceRating,
          valueRating,
          comment,
          aspectRatings,
          wouldRecommend,
          isAnonymous,
          customerName: isAnonymous ? null : customerName,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(json.error || "Gagal mengirim feedback");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan saat mengirim feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const isRadjaBekam = data?.branch?.brand === "RADJA_BEKAM";
  const brandName = isRadjaBekam ? "Radja Bekam" : "Navara Reflexology";
  const brandTagline = isRadjaBekam ? "Pelopor Bekam Steril & Medis" : "Solusi Teman Sehatku";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-emerald-200/80 font-medium">Memuat form kepuasan pelanggan...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Tautan Tidak Tersedia</h1>
        <p className="text-white/60 text-sm max-w-sm mb-6">{error || "Link feedback mungkin sudah kedaluwarsa atau tidak valid."}</p>
        <a
          href="/"
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
        >
          Kembali ke Beranda
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Terima Kasih! 🙏</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Masukan berharga dari Anda sangat berarti bagi kami di <strong className="text-emerald-700">{brandName}</strong> untuk terus meningkatkan kualitas terapis dan kenyamanan klinik.
          </p>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-xs text-slate-600 space-y-1 mb-6 text-left">
            <div className="flex justify-between font-medium">
              <span>Cabang:</span>
              <span className="font-bold text-slate-800">{data.branch?.name || "Klinik"}</span>
            </div>
            {data.therapist && (
              <div className="flex justify-between font-medium">
                <span>Terapis:</span>
                <span className="font-bold text-slate-800">{data.therapist.name}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-1 border-t border-emerald-200/60">
              <span>Status Penilaian:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Terkirim
              </span>
            </div>
          </div>

          {data.branch?.whatsappNumber && (
            <a
              href={`https://wa.me/${data.branch.whatsappNumber.replace(/^0/, "62").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition mb-3"
            >
              <MessageSquare className="w-4 h-4" /> Hubungi WhatsApp Cabang
            </a>
          )}

          <a
            href="/"
            className="block text-slate-400 hover:text-slate-600 text-xs font-semibold mt-4 transition"
          >
            ← Selesai & Tutup Halaman
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-4 pb-20">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full" />
      </div>

      {/* Header Container */}
      <header className="w-full max-w-lg text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 mb-3 shadow-xl">
          <Image
            src={isRadjaBekam ? "/navara-logo.png" : "/navara-logo.png"}
            alt={brandName}
            width={44}
            height={44}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">{brandName}</h1>
        <p className="text-emerald-300 text-xs font-semibold tracking-wide uppercase mt-0.5">{brandTagline}</p>
      </header>

      {/* Visit Meta Card */}
      <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kunjungan di Cabang</span>
            <p className="font-bold text-sm text-white truncate">{data.branch?.name || "Klinik Utama"}</p>
          </div>
        </div>

        {data.therapist && (
          <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {data.therapist.photoUrl ? (
                  <img src={data.therapist.photoUrl} alt={data.therapist.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  data.therapist.name.charAt(0)
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Terapis Anda</span>
                <span className="text-xs font-bold text-slate-200">{data.therapist.name}</span>
              </div>
            </div>
            {data.services.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Layanan</span>
                <span className="text-xs font-semibold text-emerald-400 truncate max-w-[150px] inline-block">
                  {data.services.join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Feedback Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
        {/* 1. OVERALL RATING */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Penilaian Keseluruhan
          </span>
          <h2 className="text-lg font-bold text-white mb-1">Bagaimana Pengalaman Anda Hari Ini?</h2>
          <p className="text-xs text-slate-400 mb-6">Sentuh bintang untuk memberikan penilaian</p>

          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setOverallRating(star)}
                className="p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    star <= overallRating
                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                      : "text-slate-600 hover:text-slate-500"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="min-h-[28px] flex items-center justify-center">
            <span className="text-sm font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full">
              {RATING_LABELS[overallRating]}
            </span>
          </div>
        </div>

        {/* 2. CATEGORY RATINGS */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Penilaian Spesifik
          </h3>

          {/* Therapist Rating (if therapist assigned) */}
          {data.therapist && (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-white">Kinerja Terapis ({data.therapist.name})</p>
                <p className="text-[11px] text-slate-400">Tekanan pijatan, ketelitian, keramahan</p>
              </div>
              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setTherapistRating(star)}
                    className="p-1 hover:scale-110 active:scale-95 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= therapistRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Facility & Cleanliness */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-white">Fasilitas & Kebersihan Klinik</p>
              <p className="text-[11px] text-slate-400">Kerapihan ruangan, wangi, AC, higienitas alat</p>
            </div>
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFacilityRating(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= facilityRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Service Quality */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-white">Pelayanan Kasir & Staff</p>
              <p className="text-[11px] text-slate-400">Sambutan ramah, ketepatan jadwal, kejelasan info</p>
            </div>
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setServiceRating(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= serviceRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Value for money */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-white">Kesesuaian Harga & Manfaat</p>
              <p className="text-[11px] text-slate-400">Harga berbanding dengan manfaat terapi</p>
            </div>
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setValueRating(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= valueRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. RECOMMENDATION (NPS) */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
          <h3 className="font-bold text-sm text-white mb-1">Apakah Anda akan merekomendasikan {brandName} kepada teman atau keluarga?</h3>
          <p className="text-xs text-slate-400 mb-4">Pilihan Anda membantu kami mengukur kualitas rekomendasi</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                wouldRecommend === true
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-900/40 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <ThumbsUp className="w-4 h-4 text-emerald-400" /> Pasti, Sangat Rekomendasi
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                wouldRecommend === false
                  ? "bg-red-500/20 border-red-400 text-red-300 shadow-lg shadow-red-500/10"
                  : "bg-slate-900/40 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <ThumbsDown className="w-4 h-4 text-red-400" /> Mungkin Belum
            </button>
          </div>
        </div>

        {/* 4. OPEN COMMENTS & SUGGESTIONS */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
          <label className="block font-bold text-sm text-white mb-1">
            Kritik, Saran & Pesan Tambahan <span className="text-slate-400 text-xs font-normal">(Opsional)</span>
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Tuliskan apa saja yang menurut Anda bisa kami tingkatkan untuk kunjungan berikutnya.
          </p>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contoh: Terapis sangat teliti dan ramah, ruangan dingin dan nyaman..."
            className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />

          {/* Anonymous toggle */}
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Kirim Secara Anonim?</p>
              <p className="text-[10px] text-slate-500">Nama Anda tidak akan ditampilkan ke terapis</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isAnonymous ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isAnonymous ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] text-white font-bold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Mengirimkan Penilaian...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Kirim Feedback Sekarang</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
