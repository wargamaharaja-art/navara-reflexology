"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Phone, MapPin, Stethoscope, Calendar, Clock, CheckCircle2, ChevronDown, Search } from "lucide-react";

export function BookingForm({ 
  branches, 
  services, 
  adminWa,
  initialBranch,
  initialService 
}: { 
  branches: any[], 
  services: any[], 
  adminWa: string,
  initialBranch: string,
  initialService: string 
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    branch: initialBranch || "",
    service: initialService || "",
    date: "",
    time: "",
    notes: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialService ? [initialService] : []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categorizedServices = {
    "Paket Treatment": services.filter(s => s.category === "Paket Treatment" || (!s.category && s.name.toLowerCase().includes("paket"))),
    "Full Body Massages": services.filter(s => s.category === "Full Body Massages" || (!s.category && s.name.toLowerCase().includes("pijat"))),
    "Refleksi": services.filter(s => s.category === "Refleksi" || (!s.category && (s.name.toLowerCase().includes("refleksi") || s.name.toLowerCase().includes("totok")))),
    "Bekam": services.filter(s => s.category === "Bekam" || (!s.category && s.name.toLowerCase().includes("bekam"))),
    "Adds On": services.filter(s => s.category === "Adds On" || (!s.category && (s.name.toLowerCase().includes("cek") || s.name.toLowerCase().includes("infra")))),
    "Lainnya": services.filter(s => !s.category && !s.name.toLowerCase().includes("bekam") && !s.name.toLowerCase().includes("pijat") && !s.name.toLowerCase().includes("refleksi") && !s.name.toLowerCase().includes("totok") && !s.name.toLowerCase().includes("infra") && !s.name.toLowerCase().includes("paket") && !s.name.toLowerCase().includes("cek"))
  };

  const filteredCategories = Object.entries(categorizedServices)
    .map(([category, items]) => ({
      category,
      items: items.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    }))
    .filter(c => c.items.length > 0);

  const displayServiceName = selectedServices.length > 0 
    ? selectedServices.map(id => services.find(s => s.id === id)?.name).join(", ")
    : "Pilih Layanan (Maks 3)";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the branch and service objects
    const selectedBranch = branches.find(b => b.id === formData.branch);
    
    if (selectedServices.length === 0) {
      alert("Silakan pilih minimal 1 layanan terapi");
      return;
    }

    const primaryServiceId = selectedServices[0];
    const serviceNames = selectedServices.map(id => services.find(s => s.id === id)?.name).join(", ");
    const branchName = selectedBranch?.name || formData.branch;
    
    // Determine the WhatsApp target number (Branch specific or Global Admin fallback)
    const targetWa = selectedBranch?.whatsappNumber || adminWa;

    const extraServicesText = selectedServices.length > 1 
      ? `\n\nLayanan Tambahan: ${selectedServices.slice(1).map(id => services.find(s => s.id === id)?.name).join(", ")}` 
      : "";

    const dbPayload = {
      ...formData,
      service: primaryServiceId,
      notes: formData.notes + extraServicesText
    };

    // 1. Save to Database
    try {
      await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
    } catch (error) {
      console.error("Failed to save reservation to DB", error);
    }

    // 2. Open WhatsApp
    const message = `Halo Navara Reflexology, saya ingin melakukan reservasi terapi:
    
👤 *Nama*: ${formData.name}
📱 *No. HP*: ${formData.phone}
🏥 *Cabang*: ${branchName}
💆‍♂️ *Layanan*: ${serviceNames}
📅 *Tanggal*: ${formData.date}
⏰ *Jam*: ${formData.time}
📝 *Keluhan/Catatan*: ${formData.notes || "-"}

Mohon konfirmasi ketersediaan jadwalnya. Terima kasih!`;

    // Format WhatsApp Number (wa.me requires no +, no spaces, and must include country code)
    let cleanWa = targetWa.replace(/\D/g, ''); // Remove all non-digits
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.substring(1); // Replace leading 0 with 62 (Indonesia)
    }

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanWa}?text=${encodedMessage}`;
    
    window.open(waUrl, "_blank");
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6 animate-in fade-in zoom-in duration-700 bg-gradient-to-b from-white to-emerald-50/50 rounded-3xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)] border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="w-12 h-12 text-white animate-in zoom-in duration-700 delay-300" />
        </div>
        
        <div className="relative z-10 space-y-3">
          <h3 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800">
            Reservasi Berhasil!
          </h3>
          <p className="text-slate-600 max-w-md text-sm sm:text-base leading-relaxed font-medium mx-auto">
            Data registrasi Anda telah tersimpan dengan aman. Silakan lanjutkan obrolan di WhatsApp untuk finalisasi jadwal.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ ...formData, date: "", time: "", notes: "" });
            setSelectedServices([]);
          }}
          className="relative z-10 mt-8 px-8 py-4 bg-white text-emerald-700 font-extrabold rounded-2xl hover:bg-emerald-50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-emerald-100 ring-4 ring-emerald-50/50 flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" /> Buat Reservasi Lainnya
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary">Nama Lengkap *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              required
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Cth: Budi Santoso"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary">Nomor WhatsApp *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              required
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Cth: 08123456789"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Branch */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary">Cabang Pilihan *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select 
              required
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer bg-white"
            >
              <option value="" disabled>Pilih Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Service */}
        <div className="space-y-2" ref={serviceDropdownRef}>
          <label className="text-sm font-semibold text-primary">Layanan Terapi *</label>
          <div className="relative">
            <div 
              onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${isServiceDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-gray-200'} cursor-pointer bg-white flex items-center justify-between transition-all`}
            >
              <div className="flex items-center text-slate-700 w-full overflow-hidden">
                <Stethoscope className="absolute left-3 h-5 w-5 text-gray-400" />
                <span className={selectedServices.length === 0 ? "text-slate-500" : "text-slate-700 font-medium truncate pr-4"}>
                  {displayServiceName}
                </span>
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isServiceDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-gray-100 bg-slate-50/50 sticky top-0 z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Cari layanan..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((group, idx) => (
                      <div key={idx} className="mb-1">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 rounded-md mb-1">
                          {group.category}
                        </div>
                        {group.items.map((s: any) => {
                          const isSelected = selectedServices.includes(s.id);
                          return (
                          <div 
                            key={s.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedServices(selectedServices.filter(id => id !== s.id));
                              } else {
                                if (selectedServices.length >= 3) {
                                  alert("Maksimal memilih 3 layanan");
                                  return;
                                }
                                setSelectedServices([...selectedServices, s.id]);
                              }
                            }}
                            className={`px-3 py-2.5 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-primary'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-sm font-medium">{s.name}</span>
                            </div>
                            <span className={`text-xs whitespace-nowrap ml-2 ${isSelected ? 'text-primary font-bold' : 'text-slate-500'}`}>
                              Rp {s.price.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )})}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-slate-500">
                      Layanan tidak ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary">Tanggal Reservasi *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input 
              required
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary">Perkiraan Waktu *</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input 
              required
              type="time" 
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-primary">Catatan Tambahan / Keluhan (Opsional)</label>
        <textarea 
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Ceritakan keluhan Anda secara singkat..."
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
        ></textarea>
      </div>

      <button 
        type="submit"
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-blue-600 px-8 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] active:scale-95 flex items-center justify-center gap-3"
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative flex items-center gap-2 text-[15px] sm:text-base">
          Kirim Reservasi via WhatsApp
          <Send className="h-5 w-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110" />
        </span>
      </button>
      
      <p className="text-center text-sm text-foreground/50">
        Pembayaran dilakukan langsung di klinik setelah terapi selesai.
      </p>
    </form>
  );
}
