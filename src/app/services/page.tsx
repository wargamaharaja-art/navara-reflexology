import Link from "next/link";
import { Check, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 0;

export default async function ServicesPage() {
  const activeServices = await db.select().from(services).where(eq(services.isActive, true));

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Layanan & Harga</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Transparan, terjangkau, dan berkualitas. Pilih layanan yang sesuai dengan kebutuhan kesehatan Anda.
          </p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {activeServices.length > 0 ? activeServices.map((service, index) => (
              <div key={service.id} className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row">
                <div className={`md:w-1/3 p-8 flex flex-col justify-center ${index % 2 === 0 ? 'bg-primary/5 border-r border-border' : 'bg-accent/10 border-r border-border md:order-last md:border-r-0 md:border-l'}`}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{service.name}</h3>
                  <div className="text-3xl font-extrabold text-primary mb-2">Rp {service.price.toLocaleString('id-ID')}</div>
                  <div className="text-sm font-medium text-foreground/60 mb-6 bg-background/50 inline-block px-3 py-1 rounded-full w-max">
                    Durasi: {service.durationMinutes} Menit
                  </div>
                  <Link
                    href={`/booking?service=${service.id}`}
                    className="w-full text-center bg-primary hover:bg-primary-dark text-primary-foreground py-3 rounded-lg font-semibold transition-colors mt-auto"
                  >
                    Pilih Layanan
                  </Link>
                </div>
                <div className="md:w-2/3 p-8">
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <h4 className="font-semibold text-foreground mb-3">Kategori:</h4>
                  <div className="flex items-start gap-2 text-foreground/80">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-sm font-medium">{service.category}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-gray-100">
                Belum ada layanan terapi yang aktif.
              </div>
            )}
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
