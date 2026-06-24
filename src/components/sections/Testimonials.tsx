import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Budi Santoso",
    role: "Pegawai Kantoran",
    content: "Sering pegal-pegal karena duduk seharian di depan komputer. Setelah rutin bekam sebulan sekali di Navara Reflexology, badan terasa jauh lebih enteng. Terapisnya juga sangat profesional dan alatnya steril.",
    rating: 5,
  },
  {
    id: 2,
    name: "Siti Aminah",
    role: "Ibu Rumah Tangga",
    content: "Awalnya takut mencoba bekam karena membayangkan jarum, ternyata sama sekali tidak sakit! Tempatnya sangat nyaman, bersih, dan memisahkan ruangan pria dan wanita. Sangat direkomendasikan.",
    rating: 5,
  },
  {
    id: 3,
    name: "Andi Saputra",
    role: "Driver Online",
    content: "Tekanan darah saya sempat tinggi, lalu disarankan teman untuk terapi bekam. Alhamdulillah setelah rutin bekam dan pijat refleksi di sini, keluhan pusing sering hilang dan tensi lebih stabil.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Apa Kata <span className="text-accent">Pelanggan Kami?</span>
          </h2>
          <p className="text-foreground/70 text-lg">
            Ribuan pelanggan telah merasakan manfaat langsung dari terapi bekam sunnah dan pijat refleksi kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/80 italic mb-6 leading-relaxed">
                "{t.content}"
              </p>
              <div className="mt-auto">
                <h4 className="font-bold text-foreground">{t.name}</h4>
                <span className="text-sm text-foreground/50">{t.role}</span>
              </div>
              {/* Decorative quote mark */}
              <div className="absolute top-6 right-8 text-6xl text-primary/10 font-serif leading-none">
                "
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
