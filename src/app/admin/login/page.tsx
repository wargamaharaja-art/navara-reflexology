"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ShieldCheck, Server, Cloud, CheckCircle2, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Terjadi kesalahan jaringan");
      setLoading(false);
    }
  };

  if (!isMounted) return null; // Avoid hydration mismatch

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4FBF8] text-[#1F2937] overflow-hidden font-sans relative">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        
        /* Floating label styles */
        .floating-input:focus ~ .floating-label,
        .floating-input:not(:placeholder-shown) ~ .floating-label {
          transform: translateY(-50%) scale(0.85);
          top: 0;
          color: #059669;
          background-color: white;
          padding: 0 4px;
        }
      `}} />

      {/* Decorative Background Elements for Right Panel */}
      <div className="absolute right-0 top-0 w-full md:w-[60%] h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#10B981]/10 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-400/5 blur-[80px]" />
      </div>

      {/* Left Panel: Branding (40%) */}
      <div className="w-full md:w-[40%] bg-gradient-to-br from-[#059669] to-[#047857] p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden z-10 min-h-[350px] md:min-h-screen">
        {/* Background Logo Watermark */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none mix-blend-overlay">
          <Image src="/navara-logo.png" alt="Watermark" width={800} height={800} className="object-cover scale-150 rotate-[-15deg] blur-sm" priority />
        </div>
        
        {/* Gradient Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8 md:mb-12">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <Image src="/navara-logo.png" alt="Navara Logo" width={40} height={40} className="w-10 h-10 object-contain" />
            </div>
            <span className="text-white text-2xl font-black tracking-tight drop-shadow-md">Navara Reflexology</span>
          </div>

          <div className="mt-auto md:mt-16 mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight mb-6 animate-fade-in-up delay-100 drop-shadow-lg">
              Kelola Reservasi,<br/>
              Tingkatkan Pelayanan,<br/>
              Majukan Klinik.
            </h1>
            <p className="text-emerald-50 text-lg md:text-xl max-w-md animate-fade-in-up delay-200 opacity-95 leading-relaxed font-medium drop-shadow-md">
              Sistem manajemen klinik yang cepat, aman, dan modern. Dirancang khusus untuk operasional Navara Reflexology.
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="relative z-10 mt-6 md:mt-16 space-y-4 animate-fade-in-up delay-300">
          <div className="flex items-center gap-3 text-white/95 drop-shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold text-[15px]">Reservasi Online Real-time</span>
          </div>
          <div className="flex items-center gap-3 text-white/95 drop-shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold text-[15px]">Laporan Finansial Akurat</span>
          </div>
          <div className="flex items-center gap-3 text-white/95 drop-shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold text-[15px]">Keamanan Data Terjamin</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form (60%) */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[440px] animate-fade-in-up delay-200">
          
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 text-emerald-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 border border-emerald-200/50 shadow-sm">
              <span className="text-sm md:text-base leading-none">👋</span> Selamat Datang Kembali
            </div>
            <h2 className="text-[32px] md:text-[42px] font-black text-[#1F2937] tracking-tight mb-3 leading-none">
              Admin Dashboard
            </h2>
            <p className="text-[#1F2937]/60 text-[16px] md:text-[18px] font-medium leading-snug">
              Masuk untuk mengelola operasional<br className="hidden md:block" /> Navara Reflexology.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-[20px] border border-white/60 rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-fade-in-up delay-300">
            
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-3 mb-6 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username Input */}
              <div className="relative group">
                <input
                  id="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="floating-input w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 text-[16px] font-medium text-gray-900 focus:border-[#059669] focus:outline-none focus:ring-4 focus:ring-[#059669]/10 transition-all duration-300"
                  placeholder=" "
                />
                <label htmlFor="username" className="floating-label absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium transition-all duration-300 pointer-events-none flex items-center gap-2">
                  Username
                </label>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="floating-input w-full rounded-2xl border-2 border-gray-200 bg-transparent px-4 py-4 pr-12 text-[16px] font-medium text-gray-900 focus:border-[#059669] focus:outline-none focus:ring-4 focus:ring-[#059669]/10 transition-all duration-300"
                  placeholder=" "
                />
                <label htmlFor="password" className="floating-label absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium transition-all duration-300 pointer-events-none flex items-center gap-2">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#059669] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#059669] focus:ring-[#059669] transition-colors" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Ingat saya</span>
                </label>
                <a href="#" className="text-sm font-bold text-[#059669] hover:text-[#047857] transition-colors">Lupa Password?</a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white font-bold text-[18px] py-4 rounded-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-[0_8px_25px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
                {loading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memverifikasi...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    Masuk Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Quick Trust / Badges */}
          <div className="mt-8 flex items-center justify-center gap-4 md:gap-6 animate-fade-in-up delay-400">
            <div className="flex flex-col items-center gap-1.5 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Data<br/>Terenkripsi</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                <Server className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Server<br/>Aktif</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                <Cloud className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Backup<br/>Otomatis</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
