"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Users, X, Search, User, Phone, Briefcase, MapPin } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/layout/PageHeader";

type Staff = {
  id: string;
  name: string;
  role: string;
  phone: string;
  baseSalary: number;
  dailyAllowance: number;
  isActive: boolean;
  joinedAt: string;
  branchId?: string | null;
};

type Branch = {
  id: string;
  name: string;
};

export default function AdminStaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "Admin",
    phone: "",
    baseSalary: 0,
    dailyAllowance: 0,
    isActive: true,
    branchId: "",
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const [resStaff, resBranches, resSession] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/branches"),
        fetch("/api/auth/session")
      ]);
      if (resStaff.ok) {
        const staffData = await resStaff.json();
        setStaff(staffData.data || []);
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
    fetchStaff();
  }, []);

  const getBranchName = (id?: string | null) => {
    if (!id) return "Semua Cabang (Pusat)";
    const b = branches.find(b => b.id === id);
    return b ? b.name : id;
  };

  const handleEdit = (s: Staff) => {
    setFormData({
      id: s.id,
      name: s.name,
      role: s.role,
      phone: s.phone,
      baseSalary: s.baseSalary,
      dailyAllowance: s.dailyAllowance,
      isActive: s.isActive,
      branchId: s.branchId || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pegawai ini secara permanen?")) return;
    try {
      await fetch(`/api/staff/${id}`, { method: "DELETE" });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.id) {
        await fetch(`/api/staff/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setIsFormOpen(false);
      setFormData({ id: "", name: "", role: "Admin", phone: "", baseSalary: 0, dailyAllowance: 0, isActive: true, branchId: "" });
      fetchStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesBranch = filterBranch === "all" || s.branchId === filterBranch;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBranch]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Manajemen Staff"
          description="Kelola data pegawai Non-Terapis (Admin, CS, dsb)."
          icon={Users}
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input 
                  type="text" 
                  placeholder="Cari nama/jabatan..."
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
                  setFormData({ id: "", name: "", role: "Admin", phone: "", baseSalary: 0, dailyAllowance: 0, isActive: true, branchId: "" });
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95"
              >
                <Plus className="h-5 w-5" /> Tambah Staff
              </button>
            </div>
          }
        />

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="shrink-0 bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white flex justify-between items-center shadow-md">
                <div>
                  <h3 className="text-xl font-extrabold">{formData.id ? "Edit Data Staff" : "Tambah Staff Baru"}</h3>
                  <p className="text-blue-200 text-xs mt-1">Lengkapi formulir di bawah ini</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1">
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Informasi Pribadi
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 space-y-2">
                        <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20" placeholder="Masukkan nama lengkap" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Nomor WhatsApp</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20" placeholder="08..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Jabatan / Role</label>
                        <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20" placeholder="Admin / CS / OB" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Status Aktif</label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="h-5 w-5 text-primary rounded" />
                          <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer w-full">Staff Aktif</label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Penempatan Cabang</label>
                        <select 
                          disabled={session?.role === "BRANCH_ADMIN"}
                          value={formData.branchId} 
                          onChange={e => setFormData({...formData, branchId: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                        >
                          <option value="">Semua Cabang (Pusat)</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> Kompensasi
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Gaji Pokok (Rp)</label>
                        <input type="number" min="0" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value === "" ? 0 : parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Uang Makan / Transport per Kehadiran (Rp)</label>
                        <input type="number" min="0" value={formData.dailyAllowance} onChange={e => setFormData({...formData, dailyAllowance: e.target.value === "" ? 0 : parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-6">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl text-gray-600 font-bold">Batal</button>
                    <button type="submit" disabled={saving} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">Simpan</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Memuat data staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada data staff yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 leading-tight">{s.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-md" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Cabang</span>
                        <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{getBranchName(s.branchId)}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">No. HP</span>
                        <span className="font-medium">{s.phone}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Gaji Pokok</span>
                        <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(s.baseSalary)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredStaff.length > 0 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(filteredStaff.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
              totalItems={filteredStaff.length} 
              itemsPerPage={itemsPerPage} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
