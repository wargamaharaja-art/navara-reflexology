import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export default async function CategoryServicePage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  
  const categoryData: Record<string, { title: string, description: string, image: string, dbCategory: "Paket Treatment" | "Full Body Massages" | "Refleksi" | "Bekam" | "Adds On" }> = {
    "paket-treatment": {
      title: "Paket Treatment Kombinasi",
      description: "Pilihan paket lengkap terapi untuk hasil yang lebih maksimal dan menyeluruh dengan harga yang lebih hemat.",
      image: "/bekam_banner.png",
      dbCategory: "Paket Treatment"
    },
    "full-body-massages": {
      title: "Full Body Massages",
      description: "Pijatan ke seluruh tubuh untuk menghilangkan lelah, pegal, dan memulihkan energi setelah rutinitas yang padat.",
      image: "/refleksi_banner.png",
      dbCategory: "Full Body Massages"
    },
    "refleksi": {
      title: "Pijat Refleksi & Relaksasi",
      description: "Terapi pijat yang berfokus pada titik-titik saraf tubuh untuk mengembalikan energi dan menghilangkan stres.",
      image: "/refleksi_banner.png",
      dbCategory: "Refleksi"
    },
    "bekam": {
      title: "Layanan Terapi Bekam",
      description: "Terapi pengeluaran darah kotor (toksin) dari dalam tubuh melalui permukaan kulit dengan peralatan steril. Mengembalikan kebugaran dan menyembuhkan berbagai penyakit secara alami.",
      image: "/bekam_banner.png",
      dbCategory: "Bekam"
    },
    "adds-on": {
      title: "Adds On Treatment",
      description: "Layanan tambahan ringan yang bisa disisipkan untuk melengkapi terapi utama Anda.",
      image: "/adds_on_banner.png",
      dbCategory: "Adds On"
    }
  };

  const data = categoryData[category];
  
  if (!data) {
    return notFound();
  }

  // Fetch services from database for this category
  const dbServices = await db.select()
    .from(services)
    .where(
      and(
        eq(services.category, data.dbCategory),
        eq(services.isActive, true)
      )
    );

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Header */}
      <section className="relative text-primary-foreground py-24 md:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={data.image}
            alt={data.title}
            fill
            className="object-cover object-center"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/65 z-10"></div>
        </div>
        <div className="container mx-auto px-4 relative z-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#86c7c2] drop-shadow-md">{data.title}</h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto drop-shadow-lg">
            {data.description}
          </p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {dbServices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Belum ada layanan tersedia di kategori ini.</div>
            ) : dbServices.map((service, index) => {
              const imgSrc = data.image;

              return (
                <div key={service.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row group">
                  
                  {/* Column 1: Image */}
                  <div className="w-full md:w-1/3 h-56 md:h-auto relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-border bg-gray-100 flex items-center justify-center">
                     <Image 
                       src={imgSrc} 
                       alt={service.name} 
                       fill 
                       className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                     <div className="absolute bottom-4 left-5 right-5">
                       <span className="text-white font-bold text-xl drop-shadow-md leading-tight block">{service.name}</span>
                     </div>
                  </div>

                  {/* Column 2: Price & Booking */}
                  <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-center bg-white relative">
                    <h3 className="text-2xl font-bold text-foreground mb-2 relative z-10">{service.name}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto pt-4 border-t border-gray-100 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Harga mulai dari</div>
                        <div className="text-3xl font-black text-primary">Rp {service.price.toLocaleString('id-ID')}</div>
                        <div className="text-sm font-medium text-gray-600 mt-1 flex items-center gap-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{service.durationMinutes} Menit</span>
                        </div>
                      </div>
                      <Link
                        href={`/booking?service=${encodeURIComponent(service.name)}`}
                        className="w-full sm:w-auto text-center bg-gradient-to-r from-[#86c7c2] to-[#60a8a3] hover:from-[#72b1ab] hover:to-[#509691] text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 shrink-0"
                      >
                        Booking Sekarang
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOP Sterilisasi */}
      <section className="py-16 bg-secondary/30 mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-background p-8 md:p-12 rounded-3xl border border-primary/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-3">SOP Keamanan & Sterilisasi Alat</h2>
                <p className="text-foreground/70 mb-4">
                  Keamanan Anda adalah prioritas utama kami. Kami menerapkan standar medis yang ketat untuk mencegah penularan penyakit.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <span className="text-foreground/80"><strong>Jarum Sekali Pakai (Single Use):</strong> Jarum bekam selalu baru untuk setiap pasien dan langsung dibuang ke kotak limbah medis khusus.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <span className="text-foreground/80"><strong>Sterilisasi Cup Bekam:</strong> Cup yang digunakan dicuci dengan disinfektan medis tingkat tinggi dan disterilkan menggunakan mesin sterilisator UV & Ozon.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <span className="text-foreground/80"><strong>APD Terapis:</strong> Terapis diwajibkan menggunakan sarung tangan medis (handscoon) dan masker selama prosedur tindakan.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
