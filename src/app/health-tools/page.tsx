import Link from "next/link";
import { Activity, Scale, BrainCircuit, HeartPulse } from "lucide-react";

export default function HealthToolsHub() {
  const tools = [
    {
      title: "Kalkulator BMI",
      description: "Ketahui apakah berat badan Anda sudah ideal, kurang, atau berlebih berdasarkan tinggi badan Anda.",
      icon: <Scale className="h-10 w-10 text-primary" />,
      href: "/health-tools/bmi",
      color: "bg-blue-50 border-blue-100",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Cek Stres Meter",
      description: "Ukur tingkat stres dan kelelahan mental Anda dengan kuesioner singkat yang didesain oleh ahli.",
      icon: <BrainCircuit className="h-10 w-10 text-accent" />,
      href: "/health-tools/stress",
      color: "bg-yellow-50 border-yellow-100",
      buttonColor: "bg-accent-dark hover:bg-yellow-600",
    },
    {
      title: "Risiko Diabetes",
      description: "Evaluasi gaya hidup Anda untuk mendeteksi seberapa besar risiko Anda terkena diabetes di masa depan.",
      icon: <HeartPulse className="h-10 w-10 text-red-500" />,
      href: "/health-tools/diabetes",
      color: "bg-red-50 border-red-100",
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/5 py-16 md:py-20 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Activity className="h-4 w-4" />
            <span>Fitur Gratis</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Pusat <span className="text-accent">Cek Kesehatan</span> Mandiri
          </h1>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Kenali kondisi tubuh Anda lebih dini. Gunakan alat skrining kesehatan gratis dari Navara Reflexology untuk membantu Anda mengambil keputusan tepat demi kesehatan yang lebih baik.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tools.map((tool, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-8 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-card ${tool.color}`}
            >
              <div className="mb-6 bg-white p-4 rounded-full shadow-sm">
                {tool.icon}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">{tool.title}</h2>
              <p className="text-foreground/70 mb-8 flex-grow">
                {tool.description}
              </p>
              <Link
                href={tool.href}
                className={`w-full py-3 px-6 text-white font-bold rounded-xl transition-colors ${tool.buttonColor}`}
              >
                Mulai Tes Sekarang
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
