"use client";

import { useState } from "react";
import { Activity, Brain, Moon, BatteryLow, Dumbbell, Wind, ArrowRight, Sparkles, X } from "lucide-react";
import Link from "next/link";

const gejalaData = [
  { id: 1, name: "Pegal & Linu", service: "Pijat Refleksi Full Body", url: "/booking?service=pijat-refleksi", icon: Activity, color: "from-blue-400 to-blue-600", shadow: "shadow-blue-200" },
  { id: 2, name: "Sering Pusing", service: "Bekam Kepala", url: "/booking?service=bekam-kepala", icon: Brain, color: "from-purple-400 to-purple-600", shadow: "shadow-purple-200" },
  { id: 3, name: "Sulit Tidur", service: "Pijat Refleksi", url: "/booking?service=pijat-refleksi", icon: Moon, color: "from-indigo-400 to-indigo-600", shadow: "shadow-indigo-200" },
  { id: 4, name: "Mudah Lelah", service: "Bekam Sunnah", url: "/booking?service=bekam-sunnah", icon: BatteryLow, color: "from-red-400 to-rose-600", shadow: "shadow-red-200" },
  { id: 5, name: "Otot Kaku", service: "Paket Bekam + Refleksi", url: "/booking?service=paket-bundling", icon: Dumbbell, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-200" },
  { id: 6, name: "Stres Berlebih", service: "Bekam Holistik", url: "/booking?service=bekam-holistik", icon: Wind, color: "from-teal-400 to-emerald-500", shadow: "shadow-teal-200" }
];

export function InteractiveGejala() {
  const [selectedGejala, setSelectedGejala] = useState<typeof gejalaData[0] | null>(null);

  return (
    <div className="w-full">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {gejalaData.map((gejala) => {
          const isSelected = selectedGejala?.id === gejala.id;
          const Icon = gejala.icon;
          
          return (
            <button 
              key={gejala.id} 
              onClick={() => setSelectedGejala(gejala)}
              className={`relative group overflow-hidden rounded-2xl transition-all duration-500 flex flex-col items-center justify-center p-6 sm:p-8 ${
                isSelected 
                  ? `scale-[1.03] shadow-lg ${gejala.shadow} ring-2 ring-offset-2 ring-primary border-transparent bg-gradient-to-br ${gejala.color} text-white` 
                  : "bg-white border border-border hover:shadow-xl hover:-translate-y-1 text-foreground/80 hover:border-primary/30"
              }`}
            >
              {/* Background Glow Effect on Hover (if not selected) */}
              {!isSelected && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${gejala.color} transition-opacity duration-500`} />
              )}
              
              <div className={`relative z-10 h-16 w-16 mb-4 rounded-full flex items-center justify-center transition-all duration-500 ${
                isSelected 
                  ? "bg-white/20 text-white backdrop-blur-sm" 
                  : `bg-gradient-to-br ${gejala.color} text-white group-hover:scale-110 shadow-md ${gejala.shadow}`
              }`}>
                <Icon className="h-8 w-8" />
              </div>
              
              <span className={`relative z-10 text-sm sm:text-base font-bold transition-colors duration-300 ${isSelected ? "text-white" : "group-hover:text-primary"}`}>
                {gejala.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Result Area Modal */}
      {selectedGejala && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedGejala(null)}
          ></div>
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-300">
            {/* Close button */}
            <button 
              onClick={() => setSelectedGejala(null)}
              className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Decorative Background */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${selectedGejala.color} opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
            <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br ${selectedGejala.color} opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3`} />
            
            <div className="relative z-10 p-8 sm:p-10 text-center flex flex-col items-center">
              <div className="inline-flex items-center justify-center p-2 bg-accent/10 rounded-full mb-6">
                <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Rekomendasi Terapi
                </span>
              </div>
              
              <h3 className="text-2xl font-medium text-foreground/80 mb-8 leading-relaxed">
                Untuk keluhan <span className="font-extrabold text-primary border-b-2 border-accent">"{selectedGejala.name}"</span>,<br />
                tubuh Anda sangat membutuhkan <span className="font-extrabold text-primary">{selectedGejala.service}</span>
              </h3>
              
              <Link 
                href={selectedGejala.url} 
                className={`group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r ${selectedGejala.color} rounded-full shadow-lg ${selectedGejala.shadow} hover:shadow-xl hover:scale-105 overflow-hidden w-full`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Pesan {selectedGejala.service} <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Helper text */}
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="text-center animate-pulse flex flex-col items-center justify-center text-foreground/40">
          <ArrowRight className="h-6 w-6 -rotate-90 mb-2" />
          <p className="text-sm font-medium uppercase tracking-widest">Pilih keluhan Anda di atas</p>
        </div>
      </div>
    </div>
  );
}
