import { MapPin, Phone, Clock, Mail, Navigation2, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";

export const revalidate = 0; // Disable static caching so it always gets the latest branches if updated

function formatWa(phone: string) {
  if (!phone) return "";
  let cleanWa = phone.replace(/\D/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.substring(1);
  }
  return cleanWa;
}

export default async function ContactPage() {
  const branchList = await db.select().from(branches);
  const activeBranches = branchList.filter(b => b.isActive);
  const comingSoonBranches = branchList.filter(b => !b.isActive);

  return (
    <div className="flex flex-col w-full bg-[#f8fafc]">
      {/* Premium Hero Header */}
      <section className="relative bg-primary text-white pt-32 pb-40 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-[30%] left-[20%] w-[30%] h-[50%] rounded-full bg-accent/20 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#f8fafc] to-transparent z-10"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
            <Navigation2 className="h-4 w-4 text-accent fill-accent" />
            <span className="text-accent font-bold text-xs tracking-widest uppercase">Pusat Layanan</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
            Kontak & <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-300">Lokasi Kami</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Temukan cabang eksklusif Navara Reflexology terdekat dari domisili Anda dan rasakan kemewahan relaksasi sesungguhnya.
          </p>
        </div>
      </section>

      {/* Main Content - Branch Cards */}
      <section className="relative -mt-24 z-30 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="space-y-12">
            {activeBranches.map((branch) => (
              <div key={branch.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col lg:flex-row group hover:shadow-[0_20px_60px_rgba(134,199,194,0.15)] transition-all duration-500">
                
                {/* Branch Info Side */}
                <div className="lg:w-2/5 p-10 md:p-14 bg-white relative overflow-hidden">
                  <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors duration-700"></div>
                  
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black text-slate-800 mb-8">{branch.name}</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div className="pt-1">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat</h4>
                          <p className="text-slate-700 leading-relaxed font-medium">{branch.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                          <Phone className="h-6 w-6" />
                        </div>
                        <div className="pt-1">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Telepon</h4>
                          <p className="text-slate-700 font-bold text-lg">{branch.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div className="pt-1">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Jam Operasional</h4>
                          <div className="text-slate-700 font-medium grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                            <div>
                              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Senin - Jumat</span>
                              {branch.operatingHours}
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Sabtu - Minggu</span>
                              {branch.operatingHoursWeekend}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10">
                      <a
                        href={`https://wa.me/${formatWa(branch.whatsappNumber)}?text=${encodeURIComponent(`Halo Admin Navara Reflexology cabang ${branch.name}, saya ingin bertanya seputar layanan dan reservasi terapi.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white py-4 rounded-2xl font-bold transition-all shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_25px_rgba(34,197,94,0.4)] hover:-translate-y-1 gap-3"
                      >
                        <MessageCircle className="h-6 w-6" /> 
                        <span>Hubungi via WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Map Side */}
                <div className="lg:w-3/5 h-[400px] lg:h-auto bg-slate-100 relative overflow-hidden">
                  {/* Map overlay gradient for blending */}
                  <div className="absolute inset-0 border-[12px] border-white/50 pointer-events-none z-10 rounded-[2.5rem]"></div>
                  {branch.mapUrl ? (
                    branch.mapUrl.includes("embed") ? (
                      <iframe
                        src={branch.mapUrl}
                        className="absolute inset-0 w-full h-full border-0 grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 w-full h-full border-0 bg-red-50 flex flex-col items-center justify-center text-red-500 font-medium text-center p-8">
                        <MapPin className="h-10 w-10 mb-4 opacity-50" />
                        <p>Link peta tidak valid untuk disematkan.</p>
                        <p className="text-sm mt-2 opacity-80">Harap gunakan <b>"Sematkan Peta (Embed Map)"</b> dari Google Maps pada pengaturan Admin.</p>
                      </div>
                    )
                  ) : (
                    <div className="absolute inset-0 w-full h-full border-0 bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
                      Peta Interaktif Belum Tersedia
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Section */}
          {comingSoonBranches.length > 0 && (
            <div className="mt-32 text-center relative">
              <h2 className="text-3xl font-black text-slate-800 mb-8">Segera Hadir di Kota Anda</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {comingSoonBranches.map(branch => (
                  <div key={branch.id} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-amber-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative flex items-center gap-3 bg-white px-8 py-4 rounded-full font-bold shadow-sm border border-gray-100 group-hover:-translate-y-1 transition-transform">
                      <MapPin className="h-6 w-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
                      <span className="text-slate-700 text-lg">{branch.name}</span>
                      <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full ml-2 uppercase tracking-wider font-bold">Coming Soon</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
