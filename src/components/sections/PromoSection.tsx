import { Ticket, Percent, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function PromoSection() {
  return (
    <section className="py-20 bg-primary/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-dark px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Spesial Untuk Anda</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Promo & Penawaran <span className="text-accent">Spesial</span>
          </h2>
          <p className="text-foreground/70 text-lg">
            Gunakan kode promo di bawah ini saat melakukan reservasi untuk mendapatkan harga lebih hemat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Promo Card 1 */}
          <div className="bg-background rounded-2xl p-8 border-2 border-dashed border-accent relative group hover:shadow-lg transition-shadow">
            <div className="absolute -top-4 -left-4 bg-accent text-background font-bold px-4 py-1 rounded-full text-sm shadow-sm rotate-[-5deg]">
              Terpopuler
            </div>
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-xl text-primary">
                <Percent className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Diskon 20% Pengguna Baru</h3>
                <p className="text-foreground/70 text-sm">Berlaku untuk semua layanan bagi Anda yang pertama kali mencoba terapi di Navara Reflexology.</p>
              </div>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-xs text-foreground/50 font-medium mb-1">KODE PROMO</span>
                <span className="font-mono font-bold text-lg text-primary tracking-wider">BARUSEHAT20</span>
              </div>
              <Link 
                href="/contact" 
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-primary-foreground transition-colors"
              >
                Hubungi Kami <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Promo Card 2 */}
          <div className="bg-background rounded-2xl p-8 border border-border relative hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-accent/10 p-4 rounded-xl text-accent">
                <Ticket className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Cashback Rp 50.000</h3>
                <p className="text-foreground/70 text-sm">Khusus untuk pemesanan Paket Sehat (Bekam + Refleksi) setiap hari Jumat.</p>
              </div>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between mt-auto">
              <div>
                <span className="block text-xs text-foreground/50 font-medium mb-1">KODE PROMO</span>
                <span className="font-mono font-bold text-lg text-primary tracking-wider">JUMATBERKAH</span>
              </div>
              <Link 
                href="/contact" 
                className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
