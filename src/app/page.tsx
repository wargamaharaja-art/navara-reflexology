import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Stethoscope, Users, Star, ExternalLink, Quote, Activity, AlertCircle, ChevronDown } from "lucide-react";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { settings, services, branches } from "@/lib/db/schema";
import { HeroBookingBar } from "@/components/sections/HeroBookingBar";
import { InteractiveGejala } from "@/components/sections/InteractiveGejala";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { PWARedirect } from "@/components/ui/PWARedirect";

export const revalidate = 0; // Disable static caching so it gets the latest settings if updated

export default async function Home() {
  const settingsData = await db.select().from(settings).where(eq(settings.id, "company_info")).limit(1);
  const allServices = await db.select().from(services).where(eq(services.isActive, true));
  const activeBranches = await db.select().from(branches).where(eq(branches.isActive, true));

  const featuredServices = allServices.slice(0, 4);

  const companyInfo = settingsData[0] || {
    heroBadgeText: "TERPERCAYA & PROFESIONAL",
    heroTitle: "Solusi Teman Sehatku",
    heroDescription: "Menghadirkan layanan pengobatan sunnah berkualitas tinggi dengan standar medis modern. Temukan ketenangan dan kesembuhan alami di tangan terapis ahli kami.",
  };

  return (
    <div className="flex flex-col w-full">
      <PWARedirect />
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-32 overflow-hidden">
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 w-full h-full z-0">
          {/* Base Image */}
          <Image
            src="/hero-bekam.png"
            alt="Klinik Navara Reflexology Premium"
            unoptimized
            fill
            className="object-cover object-center scale-105 animate-[kenburns_20s_ease-in-out_infinite_alternate]"
            priority
          />
          {/* Advanced Gradients for Premium Look */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent z-10 md:w-3/4"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 to-transparent z-10 mix-blend-overlay"></div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mt-10 md:mt-0">
          <div className="max-w-3xl space-y-6 sm:space-y-8 backdrop-blur-sm bg-white/40 md:bg-white/30 p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-accent/20 to-amber-100 border border-accent/20 shadow-sm backdrop-blur-md">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-accent fill-accent" />
              <span className="text-amber-800 font-extrabold text-[10px] sm:text-xs tracking-widest uppercase">
                {companyInfo.heroBadgeText}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary leading-[1.15] sm:leading-[1.1] tracking-tight">
              {(() => {
                const title = companyInfo.heroTitle || "";
                const regex = /(berawal dari sini)/i;
                if (regex.test(title)) {
                  const parts = title.split(regex);
                  return parts.map((part, i) => 
                    regex.test(part) ? (
                      <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-accent">{part}</span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  );
                }
                
                return title.split(' ').map((word, i, arr) =>
                  i === arr.length - 1 ? (
                    <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-accent block sm:inline"> {word}</span>
                  ) : (
                    <span key={i}> {word}</span>
                  )
                );
              })()}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed max-w-2xl font-semibold sm:font-medium">
              {companyInfo.heroDescription}
            </p>

            {/* Action Bar (Search/Booking) */}
            <div className="pt-4 sm:pt-6 relative z-30">
              <div className="absolute -inset-4 bg-white/40 blur-xl rounded-[2rem] sm:rounded-[3rem] -z-10"></div>
              <HeroBookingBar branches={activeBranches} services={allServices} />
            </div>

          </div>
        </div>

        {/* Custom Animation Keyframes inline using tailwind arbitrarily (or we can just let it gracefully scale) */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes kenburns {
            0% { transform: scale(1); }
            100% { transform: scale(1.08); }
          }
        `}} />
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-50/50 blur-3xl"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-amber-50/50 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 flex flex-col items-center">
            <span className="text-accent font-bold tracking-wider uppercase text-sm mb-3">Keunggulan Kami</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-6">Mengapa Memilih <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">Navara Reflexology?</span></h2>
            <p className="text-foreground/60 max-w-2xl mx-auto text-lg leading-relaxed">Komitmen kami adalah memberikan layanan kesehatan sunnah terbaik dengan standar profesionalisme dan keamanan tertinggi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* Card 1 */}
            <div className="group relative bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-blue-200 hover:shadow-[0_20px_40px_rgb(59,130,246,0.15)] transition-all duration-500 hover:-translate-y-3 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/80 rounded-bl-[100%] -mr-10 -mt-10 transition-transform duration-700 ease-out group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-200/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-primary group-hover:text-blue-700 transition-colors">Terapis Bersertifikat</h3>
                <p className="text-foreground/70 text-base leading-relaxed">
                  Tim terapis profesional kami telah melewati pelatihan intensif dan memiliki sertifikasi resmi dalam pengobatan komplementer.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-amber-200 hover:shadow-[0_20px_40px_rgb(245,158,11,0.15)] transition-all duration-500 hover:-translate-y-3 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50/80 rounded-bl-[100%] -mr-10 -mt-10 transition-transform duration-700 ease-out group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-amber-200/50 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                  <Stethoscope className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-primary group-hover:text-amber-600 transition-colors">Alat Steril 100%</h3>
                <p className="text-foreground/70 text-base leading-relaxed">
                  Kami menjamin higienitas maksimal dengan protokol sterilisasi berstandar medis tinggi untuk setiap peralatan yang digunakan.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-emerald-200 hover:shadow-[0_20px_40px_rgb(16,185,129,0.15)] transition-all duration-500 hover:-translate-y-3 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50/80 rounded-bl-[100%] -mr-10 -mt-10 transition-transform duration-700 ease-out group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="h-20 w-20 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-teal-200/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-primary group-hover:text-emerald-600 transition-colors">Nyaman & Terpisah</h3>
                <p className="text-foreground/70 text-base leading-relaxed">
                  Menjaga privasi Anda dengan area pelayanan yang nyaman dan terpisah secara eksklusif bagi pria dan wanita.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Gejala Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">Apakah Anda Sering Merasakan Ini?</h2>
            <p className="text-foreground/60">Tubuh memberikan sinyal ketika butuh istirahat dan perawatan.</p>
          </div>
          <InteractiveGejala />
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-[#f1f5f9]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-3">Layanan Unggulan Kami</h2>
              <p className="text-foreground/70 max-w-2xl">Kami menawarkan berbagai terapi sunnah dan pengobatan holistik yang ditangani langsung oleh terapis bersertifikat resmi.</p>
            </div>
            <Link href="/services" className="hidden md:flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors group">
              Lihat Semua Layanan <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredServices.map((service, idx) => {
              const imagePath = `/images/services/${service.id}.png`;
              const exists = fs.existsSync(path.join(process.cwd(), `public${imagePath}`));
              return (
                <div key={service.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-border flex flex-col sm:flex-row">
                  <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden group">
                    <Image
                      src={exists ? imagePath : '/images/hero-bekam.jpg'}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      sizes="(max-width: 640px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                  </div>
                  <div className="p-6 sm:w-3/5 flex flex-col justify-center">
                    <div className="text-xs font-bold text-accent tracking-wider mb-2 uppercase flex items-center gap-1">
                      {idx % 2 === 0 ? <ShieldCheck className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />}
                      {idx % 2 === 0 ? 'SUNNAH THERAPY' : 'RELAXATION'}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-primary">{service.name}</h3>
                    <p className="text-foreground/70 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>
                    <div className="text-primary font-bold mb-4">
                      Rp {service.price.toLocaleString('id-ID')}
                    </div>
                    <Link href={`/booking?service=${service.id}`} className="text-primary font-medium hover:text-primary/80 text-sm border-b border-primary/30 inline-block w-max pb-0.5">
                      Pesan Layanan
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-3">Apa Kata Mereka?</h2>
            <p className="text-foreground/60 text-sm">Cerita kesembuhan dari teman sehat Navara Reflexology.</p>
          </div>

          <div className="relative">
            <TestimonialCarousel />
          </div>
        </div>
      </section>

      {/* Blog Highlights Section */}
      <section className="py-24 bg-[#f8fafc] relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div className="max-w-2xl">
              <span className="text-accent font-bold tracking-wider uppercase text-sm mb-3 block">Artikel & Edukasi</span>
              <h2 className="text-4xl font-extrabold text-primary mb-4">Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">Kesehatan Terkini</span></h2>
              <p className="text-foreground/60 text-lg">Edukasi seputar pengobatan sunnah dan tips menjaga kesehatan paripurna di era modern.</p>
            </div>
            <Link href="/blog" className="group hidden md:flex items-center gap-2 bg-white px-6 py-3 rounded-full font-bold text-primary shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-primary/20">
              Lihat Semua Artikel <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Manfaat Terapi Bekam untuk Meredakan Hipertensi",
                desc: "Ketahui bagaimana metode pengeluaran darah kotor dapat membantu menstabilkan tekanan darah Anda secara alami.",
                category: "Kesehatan",
                date: "12 Jun 2026",
                image: "/images/blog/hipertensi.png"
              },
              {
                title: "Pijat Refleksi: Solusi Ampuh Mengatasi Insomnia",
                desc: "Sulit tidur di malam hari? Pelajari titik-titik pijat refleksi yang dapat membantu merelaksasi pikiran dan tubuh.",
                category: "Tips",
                date: "08 Jun 2026",
                image: "/images/blog/insomnia.png"
              },
              {
                title: "Mitos dan Fakta Seputar Pengobatan Tradisional",
                desc: "Banyak informasi keliru beredar. Mari luruskan pemahaman kita mengenai metode pengobatan sunnah yang benar.",
                category: "Edukasi",
                date: "05 Jun 2026",
                image: "/images/blog/edukasi.png"
              }
            ].map((blog, idx) => (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 border border-gray-100 group flex flex-col h-full hover:-translate-y-2">
                <div className="h-56 relative overflow-hidden">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80"></div>
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-xs font-bold px-4 py-1.5 rounded-full text-primary shadow-sm">
                    {blog.category}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <div className="text-xs font-semibold text-accent mb-3 tracking-wider">{blog.date}</div>
                  <h3 className="text-xl font-bold mb-3 text-primary group-hover:text-blue-600 transition-colors leading-snug">{blog.title}</h3>
                  <p className="text-foreground/70 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">
                    {blog.desc}
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm mt-auto group-hover:gap-3 transition-all cursor-pointer">
                    Baca Artikel <ArrowRight className="h-4 w-4 text-accent" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Link href="/blog" className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full font-bold text-primary shadow-sm border border-gray-100">
              Lihat Semua Artikel <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
          <div className="text-center mb-20">
            <span className="text-accent font-bold tracking-wider uppercase text-sm mb-3 block">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-6">Pertanyaan yang <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">Sering Diajukan</span></h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">Temukan jawaban atas keraguan Anda sebelum memulai perjalanan kesembuhan bersama kami.</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Apakah terapi bekam itu terasa sakit?",
                a: "Sama sekali tidak. Proses bekam menggunakan alat steril modern yang dirancang untuk kenyamanan. Sensasi yang dirasakan umumnya hanya seperti cubitan kecil atau tarikan ringan pada kulit, dan justru memberikan efek rileks luar biasa setelahnya."
              },
              {
                q: "Berapa lama durasi satu sesi terapi?",
                a: "Secara umum, satu sesi terapi bekam atau pijat refleksi memakan waktu antara 45 hingga 60 menit. Durasi ini sudah termasuk sesi relaksasi dan konsultasi singkat sebelum terapi dimulai agar hasil lebih maksimal."
              },
              {
                q: "Apakah area terapi untuk pria dan wanita dipisah?",
                a: "Tentu saja, kami menjamin privasi Anda 100%. Navara Reflexology memiliki ruang perawatan eksklusif yang sepenuhnya terpisah antara pria dan wanita, serta selalu ditangani oleh terapis profesional dengan gender yang sama."
              },
              {
                q: "Seberapa sering sebaiknya saya melakukan bekam?",
                a: "Untuk menjaga kebugaran optimal (maintenance), bekam sunnah direkomendasikan sebulan sekali. Namun, jika Anda memiliki keluhan khusus, terapis ahli kami akan merancang jadwal terapi yang dipersonalisasi setelah sesi konsultasi."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] border border-gray-100 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden overflow-hidden">
                <summary className="flex items-center justify-between p-6 sm:p-8 font-bold text-lg cursor-pointer text-primary bg-gradient-to-r from-white to-gray-50/50 group-hover:bg-blue-50/30 transition-colors">
                  <span className="flex gap-4 items-center">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center font-black text-xl shadow-sm border border-blue-200/50">Q</span>
                    {faq.q}
                  </span>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-white transition-transform duration-500 group-open:-rotate-180" />
                  </div>
                </summary>
                <div className="px-6 sm:px-8 pb-8 pt-2 text-slate-600 text-base leading-relaxed bg-white border-t border-gray-50 flex gap-4">
                  <div className="flex-shrink-0 w-10 opacity-0 hidden sm:block"></div> {/* Spacer for alignment */}
                  <div>{faq.a}</div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
