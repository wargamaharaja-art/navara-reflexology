"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Phone, MapPin, Stethoscope, Calendar, Clock, CheckCircle2, ChevronDown, Search, ArrowRight, ArrowLeft } from "lucide-react";

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
  const [step, setStep] = useState(1);
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

  const activeCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean))) as string[];
  const categorizedServices: Record<string, typeof services> = {};
  
  activeCategories.forEach(cat => {
    categorizedServices[cat] = services.filter(s => s.category === cat);
  });
  
  const uncategorizedServices = services.filter(s => !s.category);
  if (uncategorizedServices.length > 0) {
    categorizedServices["Lainnya"] = uncategorizedServices;
  }

  const filteredCategories = Object.entries(categorizedServices)
    .map(([category, items]) => ({
      category,
      items: items.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    }))
    .filter(c => c.items.length > 0);

  const displayServiceName = selectedServices.length > 0 
    ? selectedServices.map(id => services.find(s => s.id === id)?.name).join(", ")
    : "Pilih Layanan";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 9) {
      alert("Masukkan nomor WhatsApp yang valid.");
      return;
    }
    setStep(2);
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
      serviceIds: selectedServices,
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
            setStep(1);
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
    <div className="relative">
      {/* Step Indicators */}
      <div className="flex items-center justify-center mb-10">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-500 ${step >= 1 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'}`}>
          1
        </div>
        <div className={`w-16 h-1 transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-gray-100'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-500 ${step >= 2 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'}`}>
          2
        </div>
      </div>

      {/* STEP 1: WhatsApp Input */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-left-8 duration-500">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
              <Phone className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Mulai dengan WhatsApp</h2>
            <p className="text-gray-500 text-sm">Masukkan nomor WhatsApp Anda yang aktif untuk keperluan konfirmasi reservasi.</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input 
                required
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0812xxxx"
                className="w-full pl-14 pr-6 py-5 bg-gray-50/50 rounded-2xl border-2 border-gray-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium text-gray-800 placeholder:font-normal"
                autoFocus
              />
            </div>

            <button 
              type="submit"
              className="w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-teal-600 px-8 py-5 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 group"
            >
              <span className="text-lg">Lanjutkan</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Detail Form */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4 mb-2 pb-6 border-b border-gray-100">
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lengkapi Data Diri</h2>
              <p className="text-sm text-gray-500">Nomor WhatsApp: <span className="font-semibold text-emerald-600">{formData.phone}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-gray-700">Nama Lengkap *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input 
                  required
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Cth: Budi Santoso"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-800"
                  autoFocus
                />
              </div>
            </div>

            {/* Branch */}
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-gray-700">Cabang Pilihan *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <select 
                  required
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-medium text-gray-800"
                >
                  <option value="" disabled>Pilih Cabang Terdekat</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Service */}
            <div className="space-y-2 group md:col-span-2" ref={serviceDropdownRef}>
              <label className="text-sm font-bold text-gray-700">Layanan Terapi *</label>
              <div className="relative">
                <div 
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${isServiceDropdownOpen ? 'bg-white border-primary ring-4 ring-primary/10' : 'bg-gray-50/50 border-gray-200'} cursor-pointer flex items-center justify-between transition-all group-focus-within:text-primary`}
                >
                  <div className="flex items-center text-slate-700 w-full overflow-hidden">
                    <Stethoscope className={`absolute left-4 h-5 w-5 transition-colors ${isServiceDropdownOpen || selectedServices.length > 0 ? 'text-primary' : 'text-gray-400'}`} />
                    <span className={selectedServices.length === 0 ? "text-gray-400 font-normal" : "text-gray-800 font-medium pr-4"}>
                      {displayServiceName}
                    </span>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isServiceDropdownOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
                </div>

                {isServiceDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input 
                          type="text"
                          placeholder="Cari layanan favorit Anda..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto p-3 space-y-4">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((group, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <div className="h-px bg-gray-100 flex-1"></div>
                              {group.category}
                              <div className="h-px bg-gray-100 flex-1"></div>
                            </div>
                            <div className="space-y-1 mt-2">
                              {group.items.map((s: any) => {
                                const isSelected = selectedServices.includes(s.id);
                                return (
                                <div 
                                  key={s.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedServices(selectedServices.filter(id => id !== s.id));
                                    } else {
                                      setSelectedServices([...selectedServices, s.id]);
                                    }
                                  }}
                                  className={`px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-100'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white text-primary border-white' : 'border-gray-300'}`}>
                                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <span className="text-sm font-semibold">{s.name}</span>
                                  </div>
                                  <span className={`text-xs whitespace-nowrap ml-2 ${isSelected ? 'text-primary-50 font-bold bg-white/20 px-2 py-1 rounded-md' : 'text-gray-500 bg-gray-100 px-2 py-1 rounded-md'}`}>
                                    Rp {s.price.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              )})}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-10 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-gray-200" />
                          <span>Layanan tidak ditemukan</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-gray-700">Tanggal Reservasi *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                <input 
                  required
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-gray-700">Perkiraan Jam Hadir *</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                <input 
                  required
                  type="time" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 group">
            <label className="text-sm font-bold text-gray-700">Catatan Tambahan / Keluhan <span className="text-gray-400 font-normal">(Opsional)</span></label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Beritahu kami jika Anda memiliki keluhan di bagian tubuh tertentu..."
              className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none text-gray-800 font-medium"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-8">
            <button 
              type="submit"
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-teal-600 px-8 py-4.5 font-bold text-white transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex items-center gap-2 text-lg">
                Konfirmasi Via WhatsApp
                <Send className="h-5 w-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110" />
              </span>
            </button>
            <p className="text-center text-xs text-gray-400 mt-4 font-medium">
              Pembayaran dilakukan langsung di kasir klinik setelah terapi selesai.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
