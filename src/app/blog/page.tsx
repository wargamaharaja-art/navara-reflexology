import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, User, Search, Sparkles } from "lucide-react";

export default function BlogPage() {
  const articles = [
    {
      id: "manfaat-bekam-untuk-darah-tinggi",
      title: "5 Manfaat Terapi Bekam untuk Penderita Darah Tinggi",
      excerpt: "Hipertensi atau darah tinggi dapat memicu berbagai komplikasi mematikan. Ketahui bagaimana terapi bekam sunnah dapat membantu menstabilkan tekanan darah Anda.",
      category: "Kesehatan Islami",
      author: "Dr. Ahmad",
      date: "10 Juni 2026",
      imageUrl: "/images/blog/hipertensi.png"
    },
    {
      id: "titik-refleksi-kaki",
      title: "Pijat Refleksi Kaki: Titik Saraf Mana Saja yang Ditekan?",
      excerpt: "Sering merasa lelah setelah bekerja seharian? Pelajari titik-titik pijat refleksi pada telapak kaki yang terhubung langsung dengan organ tubuh vital.",
      category: "Tips Sehat",
      author: "Terapis Budi",
      date: "5 Juni 2026",
      imageUrl: "/images/blog/insomnia.png"
    },
    {
      id: "mitos-dan-fakta-bekam",
      title: "Mitos & Fakta Seputar Bekam yang Wajib Anda Tahu",
      excerpt: "Apakah bekam itu sakit? Benarkah bekam bisa menyembuhkan segala penyakit? Mari kita kupas tuntas mitos dan fakta seputar terapi pengobatan sunnah ini.",
      category: "Edukasi",
      author: "Tim Navara Reflexology",
      date: "1 Juni 2026",
      imageUrl: "/images/blog/edukasi.png"
    }
  ];

  return (
    <div className="flex flex-col w-full bg-[#f8fafc]">
      {/* Hero Header */}
      <section className="relative bg-primary text-white pt-32 pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-[20%] left-[20%] w-[30%] h-[50%] rounded-full bg-accent/20 blur-[120px]"></div>
          <div className="absolute top-[40%] right-[10%] w-[40%] h-[60%] rounded-full bg-blue-600/10 blur-[150px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-accent font-bold text-xs tracking-widest uppercase">Edukasi Kesehatan</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
            Artikel & <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-300">Berita Sehat</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Temukan informasi terkini seputar kesehatan, rahasia pengobatan sunnah, dan tips praktis menjaga kebugaran tubuh setiap hari.
          </p>

          {/* Search Bar (Decorative for now, adds premium feel) */}
          <div className="relative max-w-2xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex shadow-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Cari artikel kesehatan..." 
              className="block w-full pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 sm:text-lg focus:outline-none"
            />
            <button className="bg-gradient-to-r from-accent to-amber-500 hover:from-amber-400 hover:to-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hidden sm:block">
              Cari
            </button>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="relative -mt-20 z-20 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article key={article.id} className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 hover:shadow-[0_20px_50px_rgba(134,199,194,0.15)] transition-all duration-500 group flex flex-col hover:-translate-y-2">
                <div className="h-64 relative overflow-hidden">
                  <Image 
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                  
                  {/* Category Badge Floating */}
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md text-primary font-bold text-xs tracking-wider px-4 py-2 rounded-full shadow-lg">
                    {article.category}
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow relative bg-white">
                  <div className="flex items-center gap-5 text-sm font-semibold text-gray-400 mb-5">
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-accent" /> {article.author}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-accent" /> {article.date}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-amber-600 transition-all leading-snug">
                    <Link href={`/blog/${article.id}`}>
                      {article.title}
                    </Link>
                  </h2>
                  <p className="text-slate-600 text-base leading-relaxed mb-8 flex-grow line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <Link 
                    href={`/blog/${article.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 group-hover:text-amber-500 mt-auto w-max"
                  >
                    <span>Baca Selengkapnya</span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Epic CTA Box */}
          <div className="mt-24 relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-primary to-emerald-950 shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-12 md:p-16 text-center border border-white/10 group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none group-hover:bg-accent/20 transition-all duration-1000"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-black text-white mb-6">Punya Pertanyaan Spesifik?</h3>
              <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto font-medium">
                Terapis profesional kami siap mendengarkan dan merancang terapi terbaik khusus untuk Anda. Konsultasikan keluhan Anda hari ini.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-amber-500 hover:from-amber-400 hover:to-amber-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_25px_rgba(251,191,36,0.3)] hover:shadow-[0_15px_35px_rgba(251,191,36,0.5)] hover:-translate-y-1 transition-all duration-300"
              >
                Hubungi Kami Sekarang <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
