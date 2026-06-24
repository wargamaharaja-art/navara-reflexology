import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function Footer() {
  const settingsData = await db.select().from(settings).where(eq(settings.id, "company_info")).limit(1);
  const companyInfo = settingsData[0] || {
    companyName: "Navara Reflexology",
    description: "Solusi Teman Sehatku. Pengobatan sunnah dan relaksasi dengan standar profesional dan klinis.",
    address: "Jl Sehat No. 123, Jakarta",
    phone: "+62 812 3456 7890",
    email: "info@navarareflexology.com",
    facebookUrl: "#",
    instagramUrl: "#",
    youtubeUrl: "#",
  };

  return (
    <footer className="bg-emerald-950 text-white pt-24 pb-10 relative overflow-hidden">
      {/* Decorative Background Glowing Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-400/10 blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="inline-block bg-white p-3 rounded-2xl shadow-lg border border-white/20 transition-transform hover:scale-105">
              <Image 
                src="/navara-logo.png" 
                alt={`${companyInfo.companyName} Logo`} 
                width={220} 
                height={73} 
                unoptimized
                className="h-14 w-auto object-contain" 
              />
            </Link>
            <p className="text-gray-300 text-base leading-relaxed pr-4 font-medium">
              {companyInfo.description}
            </p>
            <div className="flex space-x-3 pt-2">
              <a href={companyInfo.facebookUrl || "#"} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-white/10 hover:border-transparent" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                </svg>
              </a>
              <a href={companyInfo.instagramUrl || "#"} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-white/10 hover:border-transparent" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                   <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                   <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                   <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                 </svg>
              </a>
              <a href={companyInfo.youtubeUrl || "#"} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-white/10 hover:border-transparent" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                 <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                   <path d="M21.582 6.186a2.6 2.6 0 0 0-1.838-1.85C18.125 3.9 12 3.9 12 3.9s-6.125 0-7.744.436a2.6 2.6 0 0 0-1.838 1.85C2 7.822 2 12 2 12s0 4.178.418 5.814a2.6 2.6 0 0 0 1.838 1.85C5.875 20.1 12 20.1 12 20.1s6.125 0 7.744-.436a2.6 2.6 0 0 0 1.838-1.85C22 16.178 22 12 22 12s0-4.178-.418-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                 </svg>
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-black mb-6 text-emerald-400 tracking-[0.2em] uppercase">Navigasi</h4>
            <ul className="space-y-4 text-base font-medium text-gray-400">
              <li><Link href="/" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Beranda</Link></li>
              <li><Link href="/services" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Layanan</Link></li>
              <li><Link href="/about" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Tentang Kami</Link></li>
              <li><Link href="/blog" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">Artikel Sehat</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-black mb-6 text-emerald-400 tracking-[0.2em] uppercase">Kontak Kami</h4>
            <ul className="space-y-5 text-base font-medium text-gray-300">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="leading-relaxed">{companyInfo.address}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Phone className="h-4 w-4 text-emerald-400" />
                </div>
                <span>{companyInfo.phone}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Mail className="h-4 w-4 text-emerald-400" />
                </div>
                <span>{companyInfo.email}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-black mb-6 text-emerald-400 tracking-[0.2em] uppercase">Buletin Sehat</h4>
            <p className="text-base text-gray-300 mb-6 leading-relaxed font-medium">
              Dapatkan tips kesehatan sunnah eksklusif langsung ke kotak masuk Anda.
            </p>
            <form className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Masukkan Email Anda" 
                  className="w-full pl-5 pr-12 py-3.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/5 text-white placeholder-gray-500 font-medium transition-all"
                  required
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_8px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group"
              >
                <span>Berlangganan</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-gray-500">
            &copy; {new Date().getFullYear()} Navara Reflexology - Solusi Teman Sehatku
          </p>
          <div className="flex gap-6 text-sm font-medium text-gray-500">
             <Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
             <Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
