"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Users, UploadCloud, X, Search, User, Phone, Briefcase, Percent, MapPin, Image as ImageIcon, AlertTriangle, Calendar, MessageCircle, FileText } from "lucide-react";
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
  contractStartDate?: string | null;
  contractEndDate?: string | null;
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
    contractStartDate: "",
    contractEndDate: "",
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
      contractStartDate: therapist.contractStartDate || "",
      contractEndDate: therapist.contractEndDate || "",
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
      setFormData({ id: "", name: "", specialization: "", phone: "", gender: "L", baseSalary: 0, commissionRate: 0, isActive: true, branchId: "", photoUrl: "", birthDate: "", pinCode: "", contractStartDate: "", contractEndDate: "" });
      fetchTherapists();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredTherapists = therapists.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const getContractStatus = (endDate?: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', label: 'Expired', days: diffDays, color: 'bg-red-100 text-red-700' };
    if (diffDays <= 30) return { status: 'warning', label: `Sisa ${diffDays} Hari`, days: diffDays, color: 'bg-orange-100 text-orange-700 border border-orange-200' };
    return { status: 'safe', label: 'Aman', days: diffDays, color: 'bg-blue-100 text-blue-700' };
  };

  const expiringContracts = therapists.filter(t => {
    const status = getContractStatus(t.contractEndDate);
    return status?.status === 'warning' || status?.status === 'expired';
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader 
          title="Manajemen Terapis"
          description="Kelola data pegawai terapis klinik Anda."
          icon={Users}
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative w-full sm:w-auto group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari nama/spesialisasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-14 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 placeholder-gray-400 text-sm transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 opacity-60">
                  <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-[10px] font-bold text-gray-500">⌘</kbd>
                  <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-[10px] font-bold text-gray-500">K</kbd>
                </div>
              </div>
              <button 
                onClick={() => {
                  setFormData({ id: "", name: "", specialization: "", phone: "", gender: "L", baseSalary: 0, commissionRate: 0, isActive: true, branchId: "", photoUrl: "", birthDate: "", pinCode: "", contractStartDate: "", contractEndDate: "" });
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 active:scale-95 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out" />
                <Plus className="h-5 w-5 relative z-10" /> 
                <span className="relative z-10">Tambah Terapis</span>
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
              <div className="shrink-0 bg-gradient-to-r from-blue-800 to-blue-950 p-5 sm:p-6 text-white flex justify-between items-center shadow-md relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner hidden sm:block">
                    {formData.id ? <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">{formData.id ? "Edit Data Terapis" : "Tambah Terapis Baru"}</h3>
                    <p className="text-blue-200 text-xs mt-0.5 sm:mt-1 font-medium">Lengkapi formulir di bawah ini</p>
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
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Tanggal Mulai Kontrak</label>
                      <input 
                        type="date" 
                        value={formData.contractStartDate} 
                        onChange={e => setFormData({...formData, contractStartDate: e.target.value})} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Tanggal Akhir Kontrak</label>
                      <input 
                        type="date" 
                        value={formData.contractEndDate} 
                        onChange={e => setFormData({...formData, contractEndDate: e.target.value})} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                      />
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
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all">
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

        {expiringContracts.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle className="w-24 h-24 text-orange-600" />
            </div>
            <div className="flex items-start sm:items-center gap-4 relative z-10">
              <div className="p-3 bg-white/60 border border-orange-100 rounded-xl shrink-0 shadow-sm">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-orange-900">Peringatan Masa Kontrak</h4>
                <p className="text-sm text-orange-800 mt-1 font-medium">
                  Terdapat <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">{expiringContracts.length} terapis</span> yang masa kontraknya akan segera habis (&le; 30 hari) atau sudah berakhir.
                </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredTherapists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((therapist) => (
                <div 
                  key={therapist.id} 
                  className={`bg-white rounded-2xl border ${therapist.isActive ? 'border-gray-200' : 'border-gray-200 opacity-80'} shadow-sm flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-400 hover:-translate-y-1.5 group relative overflow-hidden`}
                  onClick={() => setSelectedTherapist(therapist)}
                >
                  {therapist.isActive && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  
                  <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3.5">
                        {therapist.photoUrl ? (
                          <img src={therapist.photoUrl} alt={therapist.name} className="h-14 w-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center text-xl font-black border border-blue-100/50 shadow-sm shrink-0">
                            {therapist.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-[17px] text-gray-900 leading-tight group-hover:text-blue-700 transition-colors line-clamp-1">{therapist.name}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${therapist.isActive ? 'bg-blue-100/80 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {therapist.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded-md text-[10px] text-gray-600 truncate max-w-[100px]">{therapist.specialization}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(therapist); }} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(therapist.id); }} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5 text-sm text-gray-600 mt-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Cabang</span>
                        <span className="font-semibold text-gray-900">{getBranchName(therapist.branchId)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Kontrak</span>
                        <span className="font-medium flex items-center">
                          {therapist.contractEndDate ? (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getContractStatus(therapist.contractEndDate)?.color}`}>
                              {getContractStatus(therapist.contractEndDate)?.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Tidak ada</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-gray-500 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Gaji Pokok</span>
                        <span className="font-semibold text-gray-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(therapist.baseSalary)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] p-4 flex gap-4 mt-auto border-t border-gray-100">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500 mb-0.5 font-bold uppercase tracking-widest">Pasien bln ini</div>
                      <div className="font-black text-lg text-gray-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        {therapist.patientsHandled || 0}
                      </div>
                    </div>
                    <div className="w-[1px] bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500 mb-0.5 font-bold uppercase tracking-widest">Komisi bln ini</div>
                      <div className="font-black text-blue-600 text-[15px] mt-1 line-clamp-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(therapist.totalCommission || 0)}</div>
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] shadow-2xl transform transition-all flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header with Logo */}
            <div className="relative h-24 bg-slate-50 flex items-center justify-center border-b border-gray-100 shrink-0">
              <img 
                src="/logo.png" 
                alt="Radja Bekam Logo" 
                className="h-16 w-auto object-contain" 
              />
              <button 
                onClick={() => setSelectedTherapist(null)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full p-2 transition-all hover:rotate-90 shadow-sm backdrop-blur-sm z-10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Avatar & Basic Info (Fixed) */}
            <div className="px-6 flex flex-col items-center shrink-0 relative z-10 bg-white pb-5 border-b border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center -mt-10">
                {selectedTherapist.photoUrl ? (
                  <img src={selectedTherapist.photoUrl} alt={selectedTherapist.name} className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md bg-white relative z-10" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-3xl font-black border-4 border-white shadow-md relative z-10">
                    {selectedTherapist.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedTherapist.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${selectedTherapist.isActive ? 'bg-blue-100/80 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedTherapist.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-blue-600 font-semibold text-sm">{selectedTherapist.specialization}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto custom-scrollbar flex-1 relative px-6 py-6">
              {/* Quick Statistics */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 flex justify-between items-center mb-6 border border-gray-100 shadow-sm">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Pasien (Bln Ini)</p>
                  <p className="text-lg font-black text-gray-900">{selectedTherapist.patientsHandled || 0}</p>
                </div>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Komisi</p>
                  <p className="text-lg font-black text-blue-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedTherapist.totalCommission || 0)}</p>
                </div>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Rating</p>
                  <p className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">4.9 <span className="text-xs">★</span></p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Kontak Section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kontak & Profil</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">WhatsApp</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedTherapist.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">Jenis Kelamin</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedTherapist.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Penempatan Section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Penempatan & Kontrak</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">Cabang</p>
                        <p className="font-semibold text-gray-900 text-sm">{getBranchName(selectedTherapist.branchId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">Masa Kontrak</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {selectedTherapist.contractStartDate && selectedTherapist.contractEndDate ? 
                              `${new Date(selectedTherapist.contractStartDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} - ${new Date(selectedTherapist.contractEndDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}` 
                              : "Tidak ditentukan"
                            }
                          </p>
                          {selectedTherapist.contractEndDate && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm ${getContractStatus(selectedTherapist.contractEndDate)?.color}`}>
                              {getContractStatus(selectedTherapist.contractEndDate)?.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keuangan Section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Keuangan</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">Gaji Pokok</p>
                      <p className="font-semibold text-gray-900 text-sm">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedTherapist.baseSalary)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex flex-col gap-2">
              <Link 
                href={`/admin/therapists/${selectedTherapist.id}/history`}
                className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-blue-200 text-sm shadow-sm"
              >
                <FileText className="h-4 w-4" /> Riwayat Penanganan Pasien
              </Link>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedTherapist(null); handleEdit(selectedTherapist); }} className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-gray-200 text-sm">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <a 
                  href={`https://wa.me/${selectedTherapist.phone.replace(/^0/, '62')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-[2] bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md shadow-blue-500/20 text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> Hubungi WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
