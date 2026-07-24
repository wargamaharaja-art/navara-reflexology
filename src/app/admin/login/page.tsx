"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Check, ShieldCheck, Zap, Cloud } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Mouse position for parallax
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      // 3% parallax effect as requested
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 15,
        y: (e.clientY / window.innerHeight - 0.5) * 15,
      });
    };

    // Only apply on desktop
    if (window.innerWidth >= 768) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    
    return () => window.removeEventListener("mousemove", handleMouseMove);
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

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F2FAF8] text-[#1F2937] overflow-hidden font-sans">
      
      {/* LEFT PANEL (40% on desktop, 35% on tablet) */}
      <div className="hidden md:flex md:w-[35%] lg:w-[40%] relative overflow-hidden flex-col justify-between p-10 lg:p-14 xl:p-16 z-10 bg-emerald-900">
        {/* Background Image & Overlay */}
        <motion.div 
          className="absolute inset-0 z-0"
          animate={{
            x: mousePosition.x,
            y: mousePosition.y,
            scale: 1.05 // to avoid edges showing during parallax
          }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
        >
          <Image 
            src="/login-bg.png" 
            alt="Clinic Interior" 
            fill 
            className="object-cover" 
            priority
          />
          {/* Overlay with linear gradient & blur */}
          <div 
            className="absolute inset-0 backdrop-blur-[6px]"
            style={{
              background: 'linear-gradient(rgba(11,82,63,0.72), rgba(20,56,48,0.78))'
            }}
          />
        </motion.div>

        {/* Floating Gradients */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white opacity-[0.18] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-emerald-300 opacity-[0.12] rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 z-0 pointer-events-none" />

        {/* Logo Area */}
        <motion.div 
          className="relative z-10 flex items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="bg-white rounded-[20px] p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center justify-center" style={{ width: '60px', height: '60px' }}>
            <Image src="/navara-logo.png" alt="Navara Reflexology" width={44} height={44} className="w-[44px] h-[44px] object-contain" />
          </div>
          <span className="text-white text-2xl font-black tracking-tight">Navara Reflexology</span>
        </motion.div>

        {/* Hero Text */}
        <div className="relative z-10 mt-auto mb-12">
          <motion.h1 
            className="text-white tracking-tight text-4xl lg:text-5xl xl:text-[54px] leading-[1.1] font-extrabold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            Kelola Reservasi.<br/>
            Tingkatkan Pelayanan.<br/>
            Majukan Klinik Anda.
          </motion.h1>
          <motion.p 
            className="text-emerald-50 text-lg lg:text-xl max-w-md mt-6 opacity-90 leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          >
            Platform manajemen holding group<br className="hidden xl:block" />
            yang menaungi Navara Reflexology<br className="hidden xl:block" />
            dan Radja Bekam.
          </motion.p>
        </div>

        {/* Feature List */}
        <div className="relative z-10 space-y-4">
          {[
            "Navara Reflexology",
            "Radja Bekam",
            "Multi Cabang",
            "Laporan Terpusat"
          ].map((feature, i) => (
            <motion.div 
              key={i}
              className="flex items-center gap-3 text-white"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 + (i * 0.05) }}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30">
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="font-medium text-[16px]">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL (60% on desktop, 65% on tablet) */}
      <div className="w-full md:w-[65%] lg:w-[60%] min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative z-10">
        
        {/* Right Background Gradient */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, #F8FCFB 0%, #F2FAF8 50%, #EDF8F5 100%)'
          }}
        />
        {/* Top Right Radial Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200 opacity-[0.12] rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4 z-0 pointer-events-none" />

        {/* Mobile Logo (Only visible on small screens) */}
        <motion.div 
          className="md:hidden flex items-center justify-center gap-3 mb-10 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
           <div className="bg-white rounded-2xl p-2 shadow-sm border border-emerald-100 flex items-center justify-center" style={{ width: '48px', height: '48px' }}>
             <Image src="/navara-logo.png" alt="Navara Reflexology" width={32} height={32} className="w-8 h-8 object-contain" />
           </div>
           <span className="text-emerald-900 text-xl font-black tracking-tight">Navara Reflexology</span>
        </motion.div>

        <div className="w-full max-w-[480px] relative z-10">
          
          {/* Heading Area */}
          <motion.div 
            className="mb-8 text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: '#E8FFF5', border: '1px solid #B9F2DA', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <span className="text-sm leading-none">👋</span> 
              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Selamat Datang Kembali</span>
            </div>
            <h2 className="text-[#1F2937] tracking-tight mb-4 leading-none text-4xl lg:text-5xl xl:text-[56px] font-extrabold">
              Admin Dashboard
            </h2>
            <p className="text-[#475467] text-[16px] md:text-[18px] leading-relaxed max-w-[420px] mx-auto md:mx-0">
              Masuk untuk mengelola seluruh operasional<br className="hidden sm:block" /> Navara Reflexology & Radja Bekam.
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            className="p-8 sm:p-10"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.75)',
              borderRadius: '30px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.10)'
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-3 mb-6 text-sm font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                <input
                  id="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-white border border-gray-200 text-gray-900 px-5 transition-all duration-200 outline-none placeholder:text-[#98A2B3] hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_5px_rgba(22,163,74,0.12)]"
                  style={{ height: '60px', borderRadius: '18px', fontSize: '16px' }}
                  placeholder="Masukkan username"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-gray-200 text-gray-900 px-5 pr-12 transition-all duration-200 outline-none placeholder:text-[#98A2B3] hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_5px_rgba(22,163,74,0.12)]"
                    style={{ height: '60px', borderRadius: '18px', fontSize: '16px' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-2"
                    aria-label="Lihat Password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Ingat saya</span>
                </label>
                <a href="#" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Lupa Password?</a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative flex items-center justify-center gap-2 text-white font-bold text-[18px] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[2px]"
                style={{ 
                  height: '60px', 
                  borderRadius: '18px',
                  background: 'linear-gradient(to right, #18B678, #119C67)',
                  boxShadow: '0 15px 35px rgba(22,163,74,0.25)'
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memverifikasi...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Masuk Sekarang 
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform duration-300">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </motion.div>

          {/* Bottom Information */}
          <motion.div 
            className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
          >
            <div className="flex items-center gap-2 bg-white/60 hover:bg-white transition-all duration-300 hover:-translate-y-1 cursor-default backdrop-blur-sm border border-emerald-100/50 px-3 py-2 shadow-sm" style={{ borderRadius: '14px' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-600">Data Aman</span>
            </div>
            
            <div className="w-[1px] h-4 bg-emerald-200/50" />

            <div className="flex items-center gap-2 bg-white/60 hover:bg-white transition-all duration-300 hover:-translate-y-1 cursor-default backdrop-blur-sm border border-emerald-100/50 px-3 py-2 shadow-sm" style={{ borderRadius: '14px' }}>
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-600">Cepat</span>
            </div>

            <div className="w-[1px] h-4 bg-emerald-200/50 hidden sm:block" />

            <div className="flex items-center gap-2 bg-white/60 hover:bg-white transition-all duration-300 hover:-translate-y-1 cursor-default backdrop-blur-sm border border-emerald-100/50 px-3 py-2 shadow-sm hidden sm:flex" style={{ borderRadius: '14px' }}>
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-600">Cloud Ready</span>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
