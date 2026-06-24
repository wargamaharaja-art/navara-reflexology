"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Users, UploadCloud, X, Search, User, Phone, Briefcase, Percent, MapPin, Image as ImageIcon } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/layout/PageHeader";

type Therapist = {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  gender: "L" | "P";
  baseSalary: number;
  commissionRate: number;
  isActive: boolean;
  joinedAt: string;
  branchId?: string | null;
  patientsHandled?: number;
  totalCommission?: number;
  photoUrl?: string | null;
  birthDate?: string | null;
  pinCode?: string | null;
};

type Branch = {
  id: string;
  name: string;
};

export default function AdminTherapistsPage() {
  const router = useRouter();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    specialization: "",
    phone: "",
    gender: "L",
    baseSalary: 0,
    commissionRate: 0,
    isActive: true,
    branchId: "",
    photoUrl: "",
    birthDate: "",
    pinCode: "",
  });

  const fetchTherapists = async () => {
    setLoading(true);
    try {
      const [resTherapists, resBranches, resSession] = await Promise.all([
        fetch("/api/therapists"),
        fetch("/api/branches"),
        fetch("/api/auth/session")
      ]);
      if (resTherapists.ok) {
        setTherapists(await resTherapists.json());
      }
      if (resBranches.ok) {
        const branchResponse = await resBranches.json();
        setBranches(branchResponse.data || []);
      }
      if (resSession.ok) {
        const sessionData = await resSession.json();
        setSession(sessionData.session);
        if (sessionData.session.role === "BRANCH_ADMIN") {
          setFormData(prev => ({ ...prev, branchId: sessionData.session.branchId || "" }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  useEffect(() => {
    if (selectedTherapist) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedTherapist]);

  const getBranchName = (id?: string | null) => {
    if (!id) return "Semua Cabang (Pusat)";
    const b = branches.find(b => b.id === id);
    return b ? b.name : id;
  };

  const handleEdit = (therapist: Therapist) => {
    setFormData({
      id: therapist.id,
      name: therapist.name,
      specialization: therapist.specialization,
      phone: therapist.phone,
      gender: therapist.gender,
      baseSalary: therapist.baseSalary,
      commissionRate: therapist.commissionRate,
      isActive: therapist.isActive,
      branchId: therapist.branchId || "",
      photoUrl: therapist.photoUrl || "",
      birthDate: therapist.birthDate || "",
      pinCode: therapist.pinCode || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus terapis ini secara permanen?")) return;
    try {
      await fetch(`/api/therapists/${id}`, { method: "DELETE" });
      fetchTherapists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return alert("Hanya file gambar yang diperbolehkan");
    if (file.size > 5 * 1024 * 1024) return alert("Ukuran foto maksimal 5MB");
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormData(prev => ({ ...prev, photoUrl: e.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.id) {
        // Update
        await fetch(`/api/therapists/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await fetch("/api/therapists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setIsFormOpen(false);
      setFormData({ id: "", name: "", specialization: "", phone: "", gender: "L", baseSalary: 0, commissionRate: 0, isActive: true, branchId: "", photoUrl: "", birthDate: "", pinCode: "" });
      fetchTherapists();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredTherapists = therapists.filter(t => {
    const matchesBranch = filterBranch === "all" || t.branchId === filterBranch;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBranch]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Manajemen Terapis"
          description="Kelola data pegawai terapis klinik Anda."
          icon={Users}
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input 
                  type="text" 
                  placeholder="Cari nama/spesialisasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 text-sm backdrop-blur-md transition-all"
                />
              </div>
              {session?.role === "SUPER_ADMIN" && (
                <select 
                  value={filterBranch} 
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm backdrop-blur-md appearance-none transition-all cursor-pointer [&>option]:text-gray-900"
                >
                  <option value="all">Semua Cabang</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
              <button 
                onClick={() => {
                  setFormData({ id: "", name: "", specialization: "", phone: "", gender: "L", baseSalary: 0, commissionRate: 0, isActive: true, branchId: "", photoUrl: "", birthDate: "", pinCode: "" });
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95"
              >
                <Plus className="h-5 w-5" /> Tambah Terapis
              </button>
            </div>
          }
        />

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsFormOpen(false)}>
            <div 
              className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[90vh] flex flex-col overflow-hidden transform transition-all" 
              onClick={e => e.stopPropagation()}
            >
              {/* Header Form */}
              <div className="shrink-0 bg-gradient-to-r from-emerald-800 to-emerald-950 p-5 sm:p-6 text-white flex justify-between items-center shadow-md relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner hidden sm:block">
                    {formData.id ? <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">{formData.id ? "Edit Data Terapis" : "Tambah Terapis Baru"}</h3>
                    <p className="text-emerald-200 text-xs mt-0.5 sm:mt-1 font-medium">Lengkapi formulir di bawah ini</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 relative z-0">
                <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Informasi Pribadi */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Informasi Pribadi
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="pl-11 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" placeholder="Masukkan nama lengkap" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Nomor WhatsApp</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="pl-11 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" placeholder="Cth: 08123456789" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Jenis Kelamin</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as "L" | "P"})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        value={formData.birthDate} 
                        onChange={e => {
                          const birthDate = e.target.value;
                          let newPin = formData.pinCode;
                          if (birthDate && (!formData.pinCode || formData.pinCode.length === 0)) {
                            const parts = birthDate.split("-");
                            if (parts.length === 3) {
                              const yyyy = parts[0];
                              const mm = parts[1];
                              const dd = parts[2];
                              newPin = `${dd}${mm}${yyyy.substring(2)}`;
                            }
                          }
                          setFormData({...formData, birthDate, pinCode: newPin});
                        }} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">PIN Keamanan (6 Digit)</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="Default: DDMMYY"
                        value={formData.pinCode} 
                        onChange={e => setFormData({...formData, pinCode: e.target.value.replace(/\D/g, "")})} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Status Aktif</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary transition-all" />
                        <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer w-full">Terapis Aktif (Masih Bekerja)</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <hr className="border-gray-100" />
                </div>

                {/* Pekerjaan & Penempatan */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Pekerjaan & Kompensasi
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700">Spesialisasi</label>
                      <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="Cth: Bekam Basah, Akupuntur" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Gaji Pokok (Rp)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-bold">Rp</span>
                        </div>
                        <input type="number" min="0" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value === "" ? 0 : parseInt(e.target.value)})} className="pl-11 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700">Penempatan Cabang</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <select 
                          disabled={session?.role === "BRANCH_ADMIN"}
                          value={formData.branchId} 
                          onChange={e => setFormData({...formData, branchId: e.target.value})} 
                          className="pl-11 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium disabled:opacity-70"
                        >
                          <option value="">Semua Cabang (Pusat)</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <hr className="border-gray-100" />
                </div>

                {/* Foto Profil */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" /> Foto Profil
                  </h4>
                  {formData.photoUrl ? (
                    <div className="relative w-32 h-32">
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl border-4 border-white shadow-lg" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, photoUrl: ""})}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-all hover:scale-110"
                        title="Hapus foto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}`}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <div className={`p-4 rounded-full mb-3 ${isDragging ? 'bg-primary/10' : 'bg-gray-100'}`}>
                        <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      <p className="text-sm text-gray-600 text-center font-medium">
                        <span className="text-primary font-bold">Klik untuk upload</span> atau drag & drop foto ke sini
                      </p>
                      <p className="text-xs text-gray-400 mt-2 font-medium">PNG, JPG, GIF (Maks. 5MB)</p>
                      <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>

              </div>

              <div className="flex gap-4 justify-end pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all">
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Data Terapis"
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Memuat data terapis...</div>
          ) : filteredTherapists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada data terapis yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredTherapists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((therapist) => (
                <div 
                  key={therapist.id} 
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                  onClick={() => setSelectedTherapist(therapist)}
                >
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {therapist.photoUrl ? (
                          <img src={therapist.photoUrl} alt={therapist.name} className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                            {therapist.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 leading-tight">{therapist.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${therapist.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {therapist.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 relative z-10">

                        <button onClick={(e) => { e.stopPropagation(); handleEdit(therapist); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(therapist.id); }} className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Cabang</span>
                        <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{getBranchName(therapist.branchId)}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Spesialisasi</span>
                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">{therapist.specialization}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">No. HP</span>
                        <span className="font-medium">{therapist.phone}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Gaji Pokok</span>
                        <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(therapist.baseSalary)}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Pasien (Bulan Ini)</div>
                        <div className="font-bold text-xl text-primary">{therapist.patientsHandled || 0}</div>
                      </div>
                      <div className="text-center border-l">
                        <div className="text-xs text-gray-500 mb-1">Komisi (Bulan Ini)</div>
                        <div className="font-bold text-green-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(therapist.totalCommission || 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredTherapists.length > 0 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(filteredTherapists.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
              totalItems={filteredTherapists.length} 
              itemsPerPage={itemsPerPage} 
            />
          )}
        </div>
      </div>

      {/* Detail Popup Modal */}
      {selectedTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTherapist(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl transform transition-all custom-scrollbar" onClick={e => e.stopPropagation()}>
            {/* Sticky Close Button (Optional, but good for UX so it stays when scrolling down) */}
            <div className="sticky top-0 z-20 flex justify-end px-4 pt-4 -mb-10 w-full pointer-events-none">
               <button 
                onClick={() => setSelectedTherapist(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-1.5 transition-colors pointer-events-auto shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="relative h-32 bg-slate-50 border-b border-gray-100 flex items-center justify-center p-4">
              <img 
                src="/navara-logo.png" 
                alt="Navara Logo" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <div className="px-6 pb-6 relative">
              <div className="absolute -top-12 left-6">
                {selectedTherapist.photoUrl ? (
                  <img src={selectedTherapist.photoUrl} alt={selectedTherapist.name} className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl font-black border-4 border-white shadow-md">
                    {selectedTherapist.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-3 mb-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${selectedTherapist.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedTherapist.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="mt-2 mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{selectedTherapist.name}</h3>
                <p className="text-primary font-bold mt-1">{selectedTherapist.specialization}</p>
              </div>
                
              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Nomor WhatsApp</p>
                    <p className="font-semibold text-gray-900">{selectedTherapist.phone}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Jenis Kelamin</p>
                    <p className="font-semibold text-gray-900">{selectedTherapist.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gaji Pokok</p>
                    <p className="font-semibold text-gray-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedTherapist.baseSalary)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Penempatan Cabang</p>
                    <p className="font-semibold text-gray-900">{getBranchName(selectedTherapist.branchId)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Pasien Bulan Ini</p>
                    <p className="font-bold text-lg text-primary">{selectedTherapist.patientsHandled || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Komisi Bulan Ini</p>
                    <p className="font-bold text-lg text-green-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedTherapist.totalCommission || 0)}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => router.push(`/admin/therapists/${selectedTherapist.id}/commissions`)}
                    className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
                  >
                    <Percent className="h-4 w-4" /> Komisi Khusus
                  </button>
                  <button onClick={() => { setSelectedTherapist(null); handleEdit(selectedTherapist); }} className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                    <Edit className="h-4 w-4" /> Edit Data
                  </button>
                  <button onClick={() => { setSelectedTherapist(null); handleDelete(selectedTherapist.id); }} className="bg-red-50 text-red-600 hover:bg-red-100 p-2.5 rounded-xl font-bold flex justify-center items-center transition-colors" title="Hapus">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
