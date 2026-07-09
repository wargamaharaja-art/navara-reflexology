"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, AlertCircle, RefreshCw, X, LogIn, LogOut } from "lucide-react";

export default function AttendanceKiosk() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; details?: any } | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fallback branch if not provided from context
  const branchId = "karawaci"; // Should ideally be selected by admin before turning on kiosk

  useEffect(() => {
    // Start camera
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
      } catch (err) {
        console.error("Camera access denied or not available", err);
        setHasCamera(false);
      }
    }
    startCamera();

    return () => {
      // Stop camera on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handlePinClick = (num: string) => {
    if (loading || countdown !== null) return;
    if (message?.type === "success") setMessage(null); // Clear success message on new input

    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        setCountdown(3);
      }
    }
  };

  const handleClear = () => {
    if (loading || countdown !== null) return;
    setPin("");
    setMessage(null);
  };

  const handleDelete = () => {
    if (loading || countdown !== null) return;
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || countdown !== null) return;
      
      if (e.key >= "0" && e.key <= "9") {
        handlePinClick(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape" || e.key === "Delete") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, pin, countdown]); 

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      submitAttendance(pin);
      setCountdown(null);
    }
  }, [countdown, pin]);


  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 jpeg
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const submitAttendance = async (submitPin: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      if (!hasCamera) {
        throw new Error("Kamera tidak terdeteksi. Harap izinkan akses kamera.");
      }

      const photoBase64 = capturePhoto();
      if (!photoBase64) {
        throw new Error("Gagal mengambil foto.");
      }

      const res = await fetch("/api/attendance/kiosk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinCode: submitPin,
          branchId: branchId,
          photoBase64: photoBase64
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ 
          type: "success", 
          text: `Absensi Berhasil!`, 
          details: {
            name: data.therapistName,
            action: data.action,
            time: data.time
          }
        });
      } else {
        setMessage({ type: "error", text: data.error || "Gagal memproses absensi", details: data.details });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan sistem" });
    } finally {
      setLoading(false);
      setPin(""); // Always clear pin after submit
      
      // Clear success message automatically after 5 seconds
      setTimeout(() => {
        setMessage(prev => prev?.type === "success" ? null : prev);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row font-sans relative overflow-hidden">
      
      {/* Tombol Keluar (Tersembunyi, untuk Admin) */}
      <button 
        onClick={() => router.push("/admin/attendance")}
        className="absolute top-4 left-4 z-50 p-3 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white rounded-full backdrop-blur-sm transition-all"
        title="Tutup Mode Kiosk"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Left Panel - Camera */}
      <div className="w-full md:w-1/2 lg:w-3/5 relative flex flex-col items-center justify-center bg-black p-4 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black pointer-events-none z-0" />
        
        <div className="z-10 w-full max-w-2xl relative">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Kiosk Absensi</h1>
            <p className="text-indigo-200 text-lg">Pusat Terapi Navara Reflexology</p>
          </div>

          <div className="relative aspect-video md:aspect-[4/3] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/50">
            {hasCamera === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Camera className="w-16 h-16 mb-4 text-slate-500 opacity-50" />
                <p className="text-xl font-bold mb-2 text-white">Kamera Tidak Tersedia</p>
                <p>Pastikan Anda telah memberikan izin akses kamera pada browser Anda.</p>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
              />
            )}
            
            {/* Overlay Frame */}
            <div className="absolute inset-0 border-[6px] border-indigo-500/30 rounded-3xl pointer-events-none z-10" />
            
            {/* Guide markers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-white/30 rounded-full pointer-events-none z-10 hidden md:block" />

            {/* Countdown Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm rounded-3xl">
                <div className="text-8xl md:text-9xl font-black text-white animate-ping drop-shadow-2xl">
                  {countdown}
                </div>
              </div>
            )}
          </div>
          <p className="text-center text-slate-400 mt-4 text-sm flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Pastikan wajah Anda terlihat jelas di kamera
          </p>
        </div>
        
        {/* Hidden canvas for capturing photo */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Right Panel - Numpad */}
      <div className="w-full md:w-1/2 lg:w-2/5 bg-white flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 shadow-2xl z-20">
        
        <div className="max-w-sm mx-auto w-full">
          {message ? (
             <div className={`p-6 rounded-3xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl ${message.type === "success" ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white" : "bg-red-50 text-red-800 border border-red-200"}`}>
               {message.type === "success" ? (
                 <div className="text-center">
                   <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                     {message.details?.action === "Clock In" ? <LogIn className="w-8 h-8" /> : <LogOut className="w-8 h-8" />}
                   </div>
                   <h3 className="text-2xl font-black mb-1">{message.details?.action}</h3>
                   <p className="text-green-50 text-lg mb-4">{message.details?.name}</p>
                   <div className="inline-block bg-black/20 px-4 py-2 rounded-xl text-xl font-bold font-mono">
                     {message.details?.time}
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center text-center">
                   <AlertCircle className="w-12 h-12 mb-3 text-red-500" />
                   <p className="font-bold">{message.text}</p>
                   {message.details && <p className="text-xs mt-2 opacity-80 font-mono break-all max-w-full">{typeof message.details === 'string' ? message.details : JSON.stringify(message.details)}</p>}
                 </div>
               )}
             </div>
          ) : (
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Masukkan PIN</h2>
              <p className="text-slate-500">Ketik 6 digit PIN rahasia Anda</p>
            </div>
          )}

          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-10">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`w-12 h-14 md:w-14 md:h-16 rounded-xl flex items-center justify-center text-3xl font-black transition-all duration-300
                  ${pin.length > i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'bg-slate-100 text-slate-300'}
                  ${loading ? 'opacity-50 animate-pulse' : ''}
                `}
              >
                {pin.length > i ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handlePinClick(num.toString())}
                disabled={loading}
                className="aspect-square rounded-2xl bg-slate-50 hover:bg-indigo-50 text-slate-800 text-3xl font-bold shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="aspect-square rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold shadow-sm border border-red-100 transition-all active:scale-95 disabled:opacity-50 focus:outline-none"
            >
              CLEAR
            </button>
            <button
              onClick={() => handlePinClick("0")}
              disabled={loading}
              className="aspect-square rounded-2xl bg-slate-50 hover:bg-indigo-50 text-slate-800 text-3xl font-bold shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 focus:outline-none"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="aspect-square rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold shadow-sm border border-slate-200 transition-all active:scale-95 disabled:opacity-50 focus:outline-none flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
            </button>
          </div>

          {loading && (
            <div className="mt-8 flex items-center justify-center text-indigo-600 gap-2 font-bold animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Memproses Absensi...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
