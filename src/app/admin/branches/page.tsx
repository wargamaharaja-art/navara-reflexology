"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin, Search, X } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  operatingHours: string;
  operatingHoursWeekend: string;
  mapUrl: string | null;
  isActive: boolean;
  brand: string;
  taxRate: number;
};

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<Branch>({
    id: "",
    name: "",
    address: "",
    phone: "",
    whatsappNumber: "",
    operatingHours: "09:00 - 21:00 WIB",
    operatingHoursWeekend: "09:00 - 21:00 WIB",
    mapUrl: "",
    isActive: true,
    brand: "NAVARA",
    taxRate: 0,
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branches?all=true");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleEdit = (branch: Branch) => {
    setFormData(branch);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      name: "",
      address: "",
      phone: "",
      whatsappNumber: "",
      operatingHours: "09:00 - 21:00 WIB",
      operatingHoursWeekend: "09:00 - 21:00 WIB",
      mapUrl: "",
      isActive: true,
      brand: "NAVARA",
      taxRate: 0,
    });
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus cabang ini? Data yang terhubung mungkin akan bermasalah.")) return;
    try {
      await fetch(`/api/branches/${id}`, { method: "DELETE" });
      fetchBranches();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditMode) {
        await fetch(`/api/branches/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Simple slugify for ID if new
        const newId = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        await fetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, id: newId }),
        });
      }
      setIsFormOpen(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Manajemen Cabang"
          description="Kelola informasi kontak dan lokasi untuk setiap cabang."
          icon={MapPin}
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input 
                  type="text" 
                  placeholder="Cari cabang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 text-sm backdrop-blur-md transition-all"
                />
              </div>
              <button 
                onClick={handleAddNew}
                className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
              >
                <Plus className="h-5 w-5" /> Tambah Cabang
              </button>
            </div>
          }
        />

        {/* Modal Form */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 border border-white/20 relative animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{isEditMode ? "Edit Cabang" : "Tambah Cabang"}</h3>
                  <p className="text-sm text-slate-500 mt-1.5">{isEditMode ? "Perbarui informasi detail untuk cabang ini." : "Masukkan informasi detail untuk cabang baru."}</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2.5 rounded-full transition-all active:scale-95">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Cabang</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium" placeholder="Contoh: Navara Jatiasih" />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Alamat Lengkap</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium resize-none leading-relaxed" placeholder="Contoh: Jl. Raya Jatiasih No.11..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">No. Telepon (Tampilan)</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="+62 812..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp (Angka Saja)</label>
                    <input type="text" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} required placeholder="62812..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium" />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-semibold text-slate-700">Jam Operasional (Senin - Jumat)</label>
                    <input type="text" value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} required placeholder="09:00 - 21:00 WIB" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium" />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-semibold text-slate-700">Jam Operasional (Sabtu - Minggu)</label>
                    <input type="text" value={formData.operatingHoursWeekend} onChange={e => setFormData({...formData, operatingHoursWeekend: e.target.value})} required placeholder="09:00 - 22:00 WIB" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <div className="relative">
                      <select value={formData.isActive ? "true" : "false"} onChange={e => setFormData({...formData, isActive: e.target.value === "true"})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm font-medium appearance-none cursor-pointer">
                        <option value="true">Aktif</option>
                        <option value="false">Tidak Aktif (Coming Soon)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Brand</label>
                    <div className="relative">
                      <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm font-medium appearance-none cursor-pointer">
                        <option value="NAVARA">Navara Reflexology</option>
                        <option value="RADJA_BEKAM">Radja Bekam</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-slate-50/80 border border-slate-200 rounded-2xl p-5 sm:p-6 mt-2 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <label className="text-base font-bold text-slate-900">Fitur Pajak Layanan</label>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Aktifkan untuk membebankan otomatis pajak pada setiap layanan di cabang ini.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={(formData.taxRate || 0) > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, taxRate: 10}); 
                            } else {
                              setFormData({...formData, taxRate: 0});
                            }
                          }}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    
                    {(formData.taxRate || 0) > 0 && (
                      <div className="pt-5 mt-5 border-t border-slate-200 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Persentase Pajak</label>
                        <div className="relative w-32">
                          <input 
                            type="number" 
                            min="1" 
                            max="100" 
                            value={formData.taxRate || ""} 
                            onChange={e => setFormData({...formData, taxRate: parseInt(e.target.value) || 0})} 
                            className="w-full pl-4 pr-8 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-sm font-bold text-emerald-700 transition-all text-center" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2 mt-2">
                    <label className="text-sm font-semibold text-slate-700">URL Lokasi GMaps (Sematkan / Embed)</label>
                    <input 
                      type="url" 
                      value={formData.mapUrl || ""} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val.includes("<iframe") && val.includes("src=")) {
                          const match = val.match(/src="([^"]+)"/);
                          if (match && match[1]) {
                            val = match[1];
                          }
                        }
                        setFormData({...formData, mapUrl: val});
                      }} 
                      placeholder="https://maps.google.com/maps?q=..." 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all duration-200 text-slate-900 text-sm placeholder-slate-400 font-medium" 
                    />
                    <p className="text-[13px] text-amber-600 font-medium mt-2 bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      WAJIB gunakan fitur "Sematkan Peta (Embed a map)" dari Google Maps. Link Share biasa (maps.app.goo.gl) TIDAK AKAN MUNCUL.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-8 mt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto px-6 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-semibold transition-all active:scale-95 text-center">Batal</button>
                  <button type="submit" disabled={saving} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center min-w-[160px]">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </span>
                    ) : "Simpan Cabang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Memuat data cabang...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Belum ada cabang.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {filteredBranches.map(branch => (
                <div key={branch.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{branch.name}</h3>
                      <span className={`inline-block mt-1 mr-2 text-xs px-2 py-0.5 rounded-full font-medium ${branch.brand === 'RADJA_BEKAM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {branch.brand === 'RADJA_BEKAM' ? 'Radja Bekam' : 'Navara'}
                      </span>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {branch.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      {branch.taxRate > 0 && (
                        <span className="inline-block mt-1 ml-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                          Pajak {branch.taxRate}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(branch)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-md transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(branch.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Telepon</div>
                        <div className="font-medium text-gray-900">{branch.phone}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Jam Operasional</div>
                        <div className="font-medium text-gray-900 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Weekday:</span><br/>
                            {branch.operatingHours}
                          </div>
                          <div>
                            <span className="text-gray-500">Weekend:</span><br/>
                            {branch.operatingHoursWeekend}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {branch.mapUrl && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-2">Pratinjau Peta Google Maps</div>
                        <div className="h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative">
                           {branch.mapUrl.includes("embed") || branch.mapUrl.includes("output=embed") ? (
                             <iframe src={branch.mapUrl} className="absolute inset-0 w-full h-full border-0" loading="lazy"></iframe>
                           ) : (
                             <div className="w-full h-full text-red-500 flex items-center justify-center text-xs text-center p-2">
                               Link bukan format Embed. Harap gunakan fitur Sematkan Peta.
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
