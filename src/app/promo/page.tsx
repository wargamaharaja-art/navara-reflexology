import Link from "next/link";


export default function PromoLandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[90vh] text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm mb-8 animate-fade-in">
          🎉 Grand Opening Navara Reflexology
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
          Promo Bekam Gratis.
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-12">
          Dalam rangka pembukaan cabang baru, kami mengundang Anda untuk merasakan manfaat terapi bekam sunnah secara gratis. Kuota terbatas setiap harinya!
        </p>

        {/* Features / TnC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-3xl text-left">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <h3 className="text-emerald-400 font-semibold mb-2">Peralatan Steril</h3>
            <p className="text-sm text-neutral-400">Jarum dan perlengkapan higienis & sekali pakai untuk keamanan pasien.</p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <h3 className="text-emerald-400 font-semibold mb-2">Terapis Ahli</h3>
            <p className="text-sm text-neutral-400">Ditangani oleh terapis pria (Ikhwan) & wanita (Akhwat) tersertifikasi.</p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <h3 className="text-emerald-400 font-semibold mb-2">Sistem Bioskop</h3>
            <p className="text-sm text-neutral-400">Pilih jam dan bed yang tersedia secara real-time seperti pesan tiket.</p>
          </div>
        </div>

        {/* CTA */}
        <Link href="/promo/booking">
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 py-6 text-lg font-medium shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
            Booking Jadwal Sekarang
          </button>
        </Link>
        <p className="text-xs text-neutral-500 mt-4">*Syarat dan ketentuan berlaku. Khusus cabang baru.</p>

      </div>
    </div>
  );
}
