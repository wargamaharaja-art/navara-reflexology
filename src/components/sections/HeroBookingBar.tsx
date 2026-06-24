"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Stethoscope, Search } from "lucide-react";

export function HeroBookingBar({ branches, services }: { branches: { id: string, name: string }[], services: { id: string, name: string }[] }) {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let query = "";
    if (selectedBranch) query += `branch=${selectedBranch}&`;
    if (selectedService) query += `service=${selectedService}`;
    
    router.push(`/booking?${query}`);
  };

  return (
    <div className="mt-8 md:mt-12 max-w-4xl w-full mx-auto bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
        
        {/* Cabang Selector */}
        <div className="flex-1 bg-gray-50 rounded-xl p-2 border border-border/50 hover:border-primary/30 transition-colors flex items-center relative">
          <MapPin className="h-5 w-5 text-primary ml-2 absolute pointer-events-none" />
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full bg-transparent pl-10 pr-4 py-2 outline-none text-foreground text-sm font-medium appearance-none cursor-pointer"
          >
            <option value="">Pilih Cabang Terdekat</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Layanan Selector */}
        <div className="flex-1 bg-gray-50 rounded-xl p-2 border border-border/50 hover:border-primary/30 transition-colors flex items-center relative">
          <Stethoscope className="h-5 w-5 text-primary ml-2 absolute pointer-events-none" />
          <select 
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full bg-transparent pl-10 pr-4 py-2 outline-none text-foreground text-sm font-medium appearance-none cursor-pointer"
          >
            <option value="">Pilih Jenis Layanan</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-4 md:py-2 px-8 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Search className="h-4 w-4" /> Cek Jadwal
        </button>

      </form>
    </div>
  );
}
