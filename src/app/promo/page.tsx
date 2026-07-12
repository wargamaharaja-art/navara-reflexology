import Link from "next/link";
import { Sparkles, ShieldCheck, UserCheck, Armchair } from "lucide-react";

export default function PromoLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-slate-800 selection:bg-emerald-500/30 pt-36 pb-20 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-5 py-2 text-sm font-bold text-emerald-700 shadow-sm backdrop-blur-sm mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Grand Opening Navara Reflexology
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-slate-900 leading-tight">
          Promo <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Bekam Gratis.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12 font-medium">
          Dalam rangka pembukaan cabang baru, kami mengundang Anda untuk merasakan manfaat terapi bekam sunnah secara gratis. Kuota terbatas setiap harinya!
        </p>

        {/* Features / TnC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl text-left">
          <div className="p-8 rounded-3xl bg-white border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all group">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg mb-2">Peralatan Steril</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Jarum dan perlengkapan higienis & sekali pakai untuk keamanan dan kenyamanan pasien.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all group">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg mb-2">Terapis Ahli</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Ditangani oleh terapis pria (Ikhwan) & wanita (Akhwat) yang tersertifikasi dan berpengalaman.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all group">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Armchair className="w-6 h-6" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg mb-2">Sistem Bioskop</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Pilih jam dan bed yang tersedia secara real-time persis seperti memesan tiket bioskop.</p>
          </div>
        </div>

        {/* CTA */}
        <Link href="/promo/booking">
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-10 py-5 text-lg font-bold shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_10px_50px_rgba(16,185,129,0.5)] flex items-center gap-3">
            Booking Jadwal Sekarang
          </button>
        </Link>
        <p className="text-sm text-slate-500 mt-6 font-medium">*Syarat dan ketentuan berlaku. Khusus cabang baru.</p>

      </div>
    </div>
  );
}
