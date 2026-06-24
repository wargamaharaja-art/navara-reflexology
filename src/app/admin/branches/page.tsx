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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">{isEditMode ? "Edit Cabang" : "Tambah Cabang Baru"}</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Nama Cabang</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required rows={2} className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">No. Telepon (Tampilan)</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="+62 812..." className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Nomor WhatsApp (Angka Saja)</label>
                    <input type="text" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} required placeholder="62812..." className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-medium text-gray-700">Jam Operasional (Senin - Jumat)</label>
                    <input type="text" value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} required placeholder="09:00 - 21:00 WIB" className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-medium text-gray-700">Jam Operasional (Sabtu - Minggu)</label>
                    <input type="text" value={formData.operatingHoursWeekend} onChange={e => setFormData({...formData, operatingHoursWeekend: e.target.value})} required placeholder="09:00 - 22:00 WIB" className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select value={formData.isActive ? "true" : "false"} onChange={e => setFormData({...formData, isActive: e.target.value === "true"})} className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary">
                      <option value="true">Aktif</option>
                      <option value="false">Tidak Aktif (Coming Soon)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">URL Lokasi GMaps (Sematkan / Embed)</label>
                    <input 
                      type="url" 
                      value={formData.mapUrl || ""} 
                      onChange={e => {
                        let val = e.target.value;
                        // Auto-extract src if they pasted the full iframe code
                        if (val.includes("<iframe") && val.includes("src=")) {
                          const match = val.match(/src="([^"]+)"/);
                          if (match && match[1]) {
                            val = match[1];
                          }
                        }
                        setFormData({...formData, mapUrl: val});
                      }} 
                      placeholder="https://maps.google.com/maps?q=..." 
                      className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" 
                    />
                    <p className="text-xs text-red-500 font-medium mt-1">WAJIB gunakan fitur "Sematkan Peta (Embed a map)" dari Google Maps. Link Share biasa (maps.app.goo.gl) TIDAK AKAN MUNCUL.</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 mt-4 border-t">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 font-medium">Batal</button>
                  <button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md font-medium">
                    {saving ? "Menyimpan..." : "Simpan Cabang"}
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
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {branch.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(branch)} className="text-teal-600 hover:bg-teal-50 p-2 rounded-md transition-colors" title="Edit">
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
