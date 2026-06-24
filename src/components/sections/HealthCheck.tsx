"use client";

import { useState } from "react";
import { Activity, HeartPulse, Brain, Scale } from "lucide-react";
import Link from "next/link";

export function HealthCheck() {
  const [activeTab, setActiveTab] = useState<"bmi" | "stres" | "diabetes" | "jantung">("bmi");

  return (
    <section className="pt-32 pb-24 relative overflow-hidden bg-primary">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 shadow-sm border border-white/20 backdrop-blur-md mb-6">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent tracking-wider uppercase">Cek Kesehatan Mandiri</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
            Ketahui Status Kesehatan <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-400">Anda (Gratis)</span>
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed font-medium">
            Deteksi dini adalah langkah awal pencegahan. Gunakan kalkulator interaktif premium kami untuk mengetahui tingkat kesehatan Anda saat ini dan dapatkan rekomendasi terapi yang paling tepat.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_80px_rgb(0,0,0,0.07)] overflow-hidden border border-white">
          {/* Segmented Control Tabs */}
          <div className="p-4 md:p-6 bg-white border-b border-gray-100">
            <div className="flex flex-wrap md:flex-nowrap bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab("bmi")}
                className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-sm rounded-xl transition-all duration-300 ${
                  activeTab === "bmi" ? "bg-white text-primary shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <Scale className={`h-5 w-5 ${activeTab === "bmi" ? "text-primary" : "text-slate-400"}`} />
                <span className="hidden sm:inline">Kalkulator</span> BMI
              </button>
              <button
                onClick={() => setActiveTab("stres")}
                className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-sm rounded-xl transition-all duration-300 ${
                  activeTab === "stres" ? "bg-white text-primary shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <Brain className={`h-5 w-5 ${activeTab === "stres" ? "text-primary" : "text-slate-400"}`} />
                Cek Stres
              </button>
              <button
                onClick={() => setActiveTab("diabetes")}
                className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-sm rounded-xl transition-all duration-300 ${
                  activeTab === "diabetes" ? "bg-white text-primary shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <Activity className={`h-5 w-5 ${activeTab === "diabetes" ? "text-primary" : "text-slate-400"}`} />
                Risiko Diabetes
              </button>
              <button
                onClick={() => setActiveTab("jantung")}
                className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-sm rounded-xl transition-all duration-300 ${
                  activeTab === "jantung" ? "bg-white text-primary shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <HeartPulse className={`h-5 w-5 ${activeTab === "jantung" ? "text-primary" : "text-slate-400"}`} />
                Risiko Jantung
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-12 min-h-[450px]">
            {activeTab === "bmi" && <BMICalculator />}
            {activeTab === "stres" && <StressCalculator />}
            {activeTab === "diabetes" && <DiabetesCalculator />}
            {activeTab === "jantung" && <HeartCalculator />}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// BMI Calculator
// ==========================================
function BMICalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<{ score: number; status: string; color: string; advice: string; linkLabel: string; linkHref: string; bgLight: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      let status = "";
      let color = "";
      let advice = "";
      let linkLabel = "";
      let linkHref = "";
      let bgLight = "";

      if (bmi < 18.5) {
        status = "Kurus (Underweight)";
        color = "text-blue-600";
        bgLight = "bg-blue-50 border-blue-200";
        advice = "Tingkatkan asupan nutrisi sehat dan lakukan latihan beban.";
        linkLabel = "Rekomendasi: Pijat Relaksasi";
        linkHref = "/services/refleksi";
      } else if (bmi >= 18.5 && bmi <= 24.9) {
        status = "Ideal (Normal)";
        color = "text-emerald-600";
        bgLight = "bg-emerald-50 border-emerald-200";
        advice = "Pertahankan gaya hidup sehat Anda! Lakukan bekam secara rutin untuk menjaga imunitas.";
        linkLabel = "Rekomendasi: Bekam Sunnah";
        linkHref = "/services/bekam";
      } else if (bmi >= 25 && bmi <= 29.9) {
        status = "Gemuk (Overweight)";
        color = "text-amber-500";
        bgLight = "bg-amber-50 border-amber-200";
        advice = "Perhatikan pola makan dan tingkatkan aktivitas fisik harian Anda.";
        linkLabel = "Rekomendasi: Bekam Holistik";
        linkHref = "/services/bekam";
      } else {
        status = "Obesitas";
        color = "text-rose-600";
        bgLight = "bg-rose-50 border-rose-200";
        advice = "Sangat disarankan untuk diet sehat, olahraga rutin, dan terapi MCU untuk cek lebih lanjut.";
        linkLabel = "Rekomendasi: Paket Lengkap MCU";
        linkHref = "/services/mcu";
      }

      setResult({ score: parseFloat(bmi.toFixed(1)), status, color, advice, linkLabel, linkHref, bgLight });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-12 items-center">
      <div className="w-full md:w-[45%]">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">Indeks Massa Tubuh</h3>
        <p className="text-slate-500 mb-8 text-base leading-relaxed">
          Ketahui apakah berat badan Anda sudah ideal. Berat badan tidak ideal dapat memicu berbagai masalah kesehatan jangka panjang.
        </p>
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tinggi Badan (cm)</label>
            <div className="relative">
               <input 
                 type="number" 
                 value={height}
                 onChange={(e) => setHeight(e.target.value)}
                 className="w-full pl-4 pr-12 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium text-lg" 
                 placeholder="Contoh: 170"
                 required
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Berat Badan (kg)</label>
            <div className="relative">
               <input 
                 type="number" 
                 value={weight}
                 onChange={(e) => setWeight(e.target.value)}
                 className="w-full pl-4 pr-12 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium text-lg" 
                 placeholder="Contoh: 65"
                 required
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_8px_20px_rgb(59,130,246,0.3)] transition-all hover:-translate-y-0.5 text-lg">
            Hitung BMI Saya
          </button>
        </form>
      </div>

      <div className="w-full md:w-[55%] h-full">
        {result ? (
          <div className={`h-full w-full rounded-[2rem] border ${result.bgLight} p-8 md:p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 shadow-sm relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/40"></div>
            <div className="relative z-10 w-full">
               <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Skor BMI Anda</div>
               <div className={`text-7xl font-black mb-2 drop-shadow-sm ${result.color}`}>{result.score}</div>
               <div className={`text-2xl font-bold mb-6 ${result.color}`}>{result.status}</div>
               <div className="w-16 h-1 bg-current mx-auto opacity-20 rounded-full mb-6"></div>
               <p className="text-slate-700 mb-8 text-lg font-medium px-4">{result.advice}</p>
               <Link href={result.linkHref} className="inline-flex items-center justify-center bg-white border-2 border-transparent hover:border-primary text-slate-800 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
                 {result.linkLabel}
               </Link>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
               <Scale className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-[250px]">Masukkan tinggi dan berat badan Anda untuk melihat hasil.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Stress Calculator
// ==========================================
function StressCalculator() {
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [result, setResult] = useState<{ status: string; color: string; advice: string; linkLabel: string; linkHref: string; bgLight: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const score = parseInt(q1) + parseInt(q2) + parseInt(q3);
    
    if (score <= 4) {
      setResult({ 
        status: "Stres Ringan / Normal", 
        color: "text-emerald-600",
        bgLight: "bg-emerald-50 border-emerald-200",
        advice: "Anda mengelola stres dengan sangat baik! Pertahankan dengan pola hidup sehat.",
        linkLabel: "Rekomendasi: Totok Wajah",
        linkHref: "/services/adds-on"
      });
    } else if (score <= 7) {
      setResult({ 
        status: "Stres Sedang", 
        color: "text-amber-500", 
        bgLight: "bg-amber-50 border-amber-200",
        advice: "Anda mulai merasa tertekan. Beristirahatlah sejenak dan lakukan relaksasi untuk otot kaku.",
        linkLabel: "Rekomendasi: Refleksi Full Body",
        linkHref: "/services/refleksi"
      });
    } else {
      setResult({ 
        status: "Stres Berat", 
        color: "text-rose-600", 
        bgLight: "bg-rose-50 border-rose-200",
        advice: "Perhatian! Anda sangat membutuhkan relaksasi mendalam. Jangan biarkan stres merusak kesehatan fisik Anda.",
        linkLabel: "Rekomendasi: Bekam Kepala",
        linkHref: "/services/bekam"
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-12 items-center">
      <div className="w-full md:w-[45%]">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">Cek Tingkat Stres</h3>
        <p className="text-slate-500 mb-8 text-base leading-relaxed">
          Jawab 3 pertanyaan sederhana ini berdasarkan perasaan dan kondisi fisik Anda dalam satu minggu terakhir.
        </p>
        <form onSubmit={calculate} className="space-y-6">
          <div className="space-y-5">
             {[
               { id: 1, val: q1, set: setQ1, q: "Seberapa sering Anda merasa kelelahan meski sudah tidur cukup?" },
               { id: 2, val: q2, set: setQ2, q: "Seberapa sering Anda merasa tegang/kaku pada area leher atau pundak?" },
               { id: 3, val: q3, set: setQ3, q: "Seberapa sering Anda merasa mudah marah atau pusing mendadak?" },
             ].map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-bold text-slate-700 mb-3">{item.id}. {item.q}</label>
                  <select 
                    value={item.val} 
                    onChange={(e) => item.set(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium cursor-pointer"
                  >
                    <option value="" disabled>Pilih jawaban...</option>
                    <option value="1">Jarang sekali</option>
                    <option value="2">Kadang-kadang</option>
                    <option value="3">Sering (Hampir tiap hari)</option>
                  </select>
                </div>
             ))}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_8px_20px_rgb(59,130,246,0.3)] transition-all hover:-translate-y-0.5 text-lg">
            Cek Hasil Analisis
          </button>
        </form>
      </div>

      <div className="w-full md:w-[55%] h-full">
        {result ? (
          <div className={`h-full w-full rounded-[2rem] border ${result.bgLight} p-8 md:p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 shadow-sm relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/40"></div>
            <div className="relative z-10 w-full">
               <div className={`w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-md mb-6 ${result.color}`}>
                  <Brain className="h-12 w-12" />
               </div>
               <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Hasil Analisis</div>
               <div className={`text-3xl md:text-4xl font-black mb-6 drop-shadow-sm ${result.color}`}>{result.status}</div>
               <div className="w-16 h-1 bg-current mx-auto opacity-20 rounded-full mb-6"></div>
               <p className="text-slate-700 mb-8 text-lg font-medium px-4">{result.advice}</p>
               <Link href={result.linkHref} className="inline-flex items-center justify-center bg-white border-2 border-transparent hover:border-primary text-slate-800 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
                 {result.linkLabel}
               </Link>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
               <Brain className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-[250px]">Jawab 3 pertanyaan di samping untuk melihat tingkat stres Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Diabetes Calculator
// ==========================================
function DiabetesCalculator() {
  const [age, setAge] = useState("");
  const [family, setFamily] = useState("");
  const [activity, setActivity] = useState("");
  const [result, setResult] = useState<{ status: string; color: string; advice: string; linkLabel: string; linkHref: string; bgLight: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    let score = parseInt(age) + parseInt(family) + parseInt(activity);
    
    if (score <= 2) {
      setResult({ 
        status: "Risiko Rendah", 
        color: "text-emerald-600",
        bgLight: "bg-emerald-50 border-emerald-200", 
        advice: "Peluang Anda terkena diabetes saat ini tergolong rendah. Jaga terus gaya hidup sehat.",
        linkLabel: "Rekomendasi: Bekam Sunnah",
        linkHref: "/services/bekam"
      });
    } else if (score <= 4) {
      setResult({ 
        status: "Risiko Sedang", 
        color: "text-amber-500", 
        bgLight: "bg-amber-50 border-amber-200",
        advice: "Anda memiliki beberapa faktor risiko. Mulai kurangi konsumsi gula berlebih.",
        linkLabel: "Rekomendasi: Cek Gula Darah",
        linkHref: "/services/mcu"
      });
    } else {
      setResult({ 
        status: "Risiko Tinggi", 
        color: "text-rose-600", 
        bgLight: "bg-rose-50 border-rose-200",
        advice: "Faktor risiko Anda cukup tinggi! Segera lakukan cek Gula Darah di fasilitas medis.",
        linkLabel: "Rekomendasi: Paket Lengkap MCU",
        linkHref: "/services/mcu"
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-12 items-center">
      <div className="w-full md:w-[45%]">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">Risiko Diabetes</h3>
        <p className="text-slate-500 mb-8 text-base leading-relaxed">
          Evaluasi risiko Anda terkena Diabetes tipe 2 berdasarkan usia, genetik, dan gaya hidup.
        </p>
        <form onSubmit={calculate} className="space-y-6">
          <div className="space-y-5">
             {[
               { 
                 id: 1, val: age, set: setAge, q: "Usia Anda saat ini?",
                 opts: [{v:"0", l:"Di bawah 35 tahun"}, {v:"1", l:"35 - 45 tahun"}, {v:"2", l:"Di atas 45 tahun"}] 
               },
               { 
                 id: 2, val: family, set: setFamily, q: "Ada keluarga inti penderita diabetes?",
                 opts: [{v:"0", l:"Tidak Ada"}, {v:"2", l:"Ya, Ada"}] 
               },
               { 
                 id: 3, val: activity, set: setActivity, q: "Seberapa sering berolahraga berkeringat?",
                 opts: [{v:"0", l:"Rutin (Min 3x seminggu)"}, {v:"1", l:"Jarang (1x seminggu)"}, {v:"2", l:"Hampir tidak pernah"}] 
               },
             ].map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-bold text-slate-700 mb-3">{item.id}. {item.q}</label>
                  <select 
                    value={item.val} 
                    onChange={(e) => item.set(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium cursor-pointer"
                  >
                    <option value="" disabled>Pilih jawaban...</option>
                    {item.opts.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                  </select>
                </div>
             ))}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_8px_20px_rgb(59,130,246,0.3)] transition-all hover:-translate-y-0.5 text-lg">
            Cek Risiko Diabetes
          </button>
        </form>
      </div>

      <div className="w-full md:w-[55%] h-full">
        {result ? (
          <div className={`h-full w-full rounded-[2rem] border ${result.bgLight} p-8 md:p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 shadow-sm relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/40"></div>
            <div className="relative z-10 w-full">
               <div className={`w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-md mb-6 ${result.color}`}>
                  <Activity className="h-12 w-12" />
               </div>
               <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Tingkat Risiko</div>
               <div className={`text-3xl md:text-4xl font-black mb-6 drop-shadow-sm ${result.color}`}>{result.status}</div>
               <div className="w-16 h-1 bg-current mx-auto opacity-20 rounded-full mb-6"></div>
               <p className="text-slate-700 mb-8 text-lg font-medium px-4">{result.advice}</p>
               <Link href={result.linkHref} className="inline-flex items-center justify-center bg-white border-2 border-transparent hover:border-primary text-slate-800 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
                 {result.linkLabel}
               </Link>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
               <Activity className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-[250px]">Jawab pertanyaan di samping untuk melihat risiko diabetes Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Heart Calculator
// ==========================================
function HeartCalculator() {
  const [bp, setBp] = useState("");
  const [smoke, setSmoke] = useState("");
  const [food, setFood] = useState("");
  const [result, setResult] = useState<{ status: string; color: string; advice: string; linkLabel: string; linkHref: string; bgLight: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    let score = parseInt(bp) + parseInt(smoke) + parseInt(food);
    
    if (score <= 1) {
      setResult({ 
        status: "Jantung Sehat", 
        color: "text-emerald-600",
        bgLight: "bg-emerald-50 border-emerald-200", 
        advice: "Risiko penyakit jantung koroner Anda rendah. Teruskan kebiasaan sehat Anda!",
        linkLabel: "Rekomendasi: Bekam Tradisional",
        linkHref: "/services/bekam"
      });
    } else if (score <= 3) {
      setResult({ 
        status: "Waspada", 
        color: "text-amber-500", 
        bgLight: "bg-amber-50 border-amber-200",
        advice: "Gaya hidup Anda mulai membebani kerja jantung. Waktunya berubah menuju hidup lebih sehat.",
        linkLabel: "Rekomendasi: Bekam Holistik",
        linkHref: "/services/bekam"
      });
    } else {
      setResult({ 
        status: "Risiko Tinggi", 
        color: "text-rose-600",
        bgLight: "bg-rose-50 border-rose-200", 
        advice: "Sangat Berbahaya! Tekanan darah, rokok, & makanan berlemak memicu plak di pembuluh darah.",
        linkLabel: "Rekomendasi: Cek Kolesterol",
        linkHref: "/services/mcu"
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-12 items-center">
      <div className="w-full md:w-[45%]">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">Risiko Jantung</h3>
        <p className="text-slate-500 mb-8 text-base leading-relaxed">
          Penyakit jantung adalah pembunuh senyap nomor 1. Ketahui risikonya sedini mungkin.
        </p>
        <form onSubmit={calculate} className="space-y-6">
          <div className="space-y-5">
             {[
               { 
                 id: 1, val: bp, set: setBp, q: "Apakah Anda memiliki tekanan darah tinggi?",
                 opts: [{v:"0", l:"Tidak"}, {v:"1", l:"Kadang-kadang tinggi"}, {v:"2", l:"Ya, sering tinggi"}] 
               },
               { 
                 id: 2, val: smoke, set: setSmoke, q: "Apakah Anda perokok aktif?",
                 opts: [{v:"0", l:"Tidak Pernah"}, {v:"1", l:"Kadang-kadang"}, {v:"2", l:"Ya, perokok aktif"}] 
               },
               { 
                 id: 3, val: food, set: setFood, q: "Sering mengkonsumsi santan / gorengan?",
                 opts: [{v:"0", l:"Jarang"}, {v:"1", l:"Cukup sering"}, {v:"2", l:"Setiap hari"}] 
               },
             ].map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-bold text-slate-700 mb-3">{item.id}. {item.q}</label>
                  <select 
                    value={item.val} 
                    onChange={(e) => item.set(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium cursor-pointer"
                  >
                    <option value="" disabled>Pilih jawaban...</option>
                    {item.opts.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                  </select>
                </div>
             ))}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_8px_20px_rgb(59,130,246,0.3)] transition-all hover:-translate-y-0.5 text-lg">
            Cek Risiko Jantung
          </button>
        </form>
      </div>

      <div className="w-full md:w-[55%] h-full">
        {result ? (
          <div className={`h-full w-full rounded-[2rem] border ${result.bgLight} p-8 md:p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 shadow-sm relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/40"></div>
            <div className="relative z-10 w-full">
               <div className={`w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-md mb-6 ${result.color}`}>
                  <HeartPulse className="h-12 w-12" />
               </div>
               <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Tingkat Risiko</div>
               <div className={`text-3xl md:text-4xl font-black mb-6 drop-shadow-sm ${result.color}`}>{result.status}</div>
               <div className="w-16 h-1 bg-current mx-auto opacity-20 rounded-full mb-6"></div>
               <p className="text-slate-700 mb-8 text-lg font-medium px-4">{result.advice}</p>
               <Link href={result.linkHref} className="inline-flex items-center justify-center bg-white border-2 border-transparent hover:border-primary text-slate-800 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
                 {result.linkLabel}
               </Link>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
               <HeartPulse className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-[250px]">Jawab pertanyaan di samping untuk melihat tingkat risiko jantung.</p>
          </div>
        )}
      </div>
    </div>
  );
}
