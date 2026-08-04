"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, Search, X, Shield, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type User = {
  id: string;
  username: string;
  name: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "THERAPIST" | "CASHIER" | "INVESTOR";
  branchId: string | null;
  permissions: string; // JSON string
  isActive: boolean;
};

const AVAILABLE_PERMISSIONS = [
  { 
    id: "DASHBOARD", 
    label: "Akses Dashboard", 
    submenus: [{ id: "DASHBOARD_ANALITIK", label: "Laporan Analitik & Grafik Pendapatan" }] 
  },
  { 
    id: "RESERVASI", 
    label: "Reservasi & Promo", 
    submenus: [
      { id: "RESERVASI_ONLINE", label: "Kelola Reservasi via Web" },
      { id: "PROMO_BEKAM", label: "Promo Bekam Gratis" }
    ] 
  },
  { 
    id: "BUKUPASIEN", 
    label: "Buku Pasien & Rekam Medis", 
    submenus: [{ id: "BUKUPASIEN_REKAMMEDIS", label: "Catatan Kunjungan & Riwayat Medis" }] 
  },
  { 
    id: "PEGAWAI", 
    label: "Akses Pegawai & Gaji", 
    submenus: [
      { id: "PEGAWAI_TERAPIS", label: "Data Terapis" },
      { id: "PEGAWAI_STAFF", label: "Data Staff" },
      { id: "PEGAWAI_ABSENSI", label: "Absensi Pegawai" },
      { id: "PEGAWAI_SLIP", label: "Slip Gaji" },
      { id: "PEGAWAI_MUTASI", label: "Surat Mutasi" }
    ] 
  },
  { 
    id: "INVENTARIS", 
    label: "Akses Inventaris Barang", 
    submenus: [{ id: "INVENTARIS_BARANG", label: "Stok Barang Masuk & Keluar" }] 
  },
  { 
    id: "KEUANGAN", 
    label: "Akses Keuangan", 
    submenus: [
      { id: "KEUANGAN_PEMASUKAN", label: "Pemasukan & Pengeluaran Utama" },
      { id: "KEUANGAN_PENGELUARAN", label: "Pengeluaran Klinik Tambahan" },
      { id: "KEUANGAN_MUTASI", label: "Mutasi Kas" },
      { id: "KEUANGAN_LABARUGI", label: "Laporan Laba Rugi" }
    ] 
  },
  { 
    id: "PENGATURAN", 
    label: "Pengaturan Sistem", 
    submenus: [
      { id: "PENGATURAN_CABANG", label: "Data Cabang" },
      { id: "LAYANAN_TERAPI", label: "Layanan Terapi" },
      { id: "PENGATURAN_PENGGUNA", label: "Pengguna Sistem" },
      { id: "PENGATURAN_KOMISI", label: "Sinkronisasi Komisi" },
      { id: "SYSTEM_LOGS", label: "System Logs" }
    ] 
  },
];

export function getDefaultPermissions(role: string): string[] {
  const superAdminPerms = [
    "DASHBOARD_ANALITIK",
    "RESERVASI_ONLINE", "PROMO_BEKAM",
    "BUKUPASIEN_REKAMMEDIS",
    "PEGAWAI_TERAPIS", "PEGAWAI_STAFF", "PEGAWAI_ABSENSI", "PEGAWAI_SLIP", "PEGAWAI_MUTASI",
    "INVENTARIS_BARANG",
    "KEUANGAN_PEMASUKAN", "KEUANGAN_PENGELUARAN", "KEUANGAN_MUTASI", "KEUANGAN_LABARUGI",
    "PENGATURAN_CABANG", "PENGATURAN_PENGGUNA", "PENGATURAN_KOMISI", "LAYANAN_TERAPI", "SYSTEM_LOGS"
  ];

  switch (role) {
    case "SUPER_ADMIN":
      return superAdminPerms;
    case "BRANCH_ADMIN":
      return superAdminPerms.filter(p => !p.startsWith("PENGATURAN_CABANG") && !p.startsWith("PENGATURAN_PENGGUNA") && !p.startsWith("PENGATURAN_KOMISI"));
    case "CASHIER":
      return ["DASHBOARD_ANALITIK", "RESERVASI_ONLINE", "BUKUPASIEN_REKAMMEDIS", "INVENTARIS_BARANG"];
    case "THERAPIST":
      return ["DASHBOARD_ANALITIK", "BUKUPASIEN_REKAMMEDIS"];
    case "INVESTOR":
      return ["DASHBOARD_ANALITIK", "KEUANGAN_PEMASUKAN", "KEUANGAN_PENGELUARAN", "KEUANGAN_MUTASI", "KEUANGAN_LABARUGI"];
    default:
      return [];
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<Omit<User, "permissions"> & { password?: string, permissions: string[] }>({
    id: "",
    username: "",
    password: "",
    name: "",
    role: "BRANCH_ADMIN",
    branchId: "",
    permissions: [],
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resBranches] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/branches?all=true")
      ]);
      
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data.data || []);
      } else {
        alert("Anda tidak memiliki akses ke halaman ini.");
      }
      
      if (resBranches.ok) {
        const data = await resBranches.json();
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (user: User) => {
    let parsedPerms: string[] = [];
    if (user.permissions) {
      try { parsedPerms = JSON.parse(user.permissions); } catch(e) {}
    } else {
      parsedPerms = getDefaultPermissions(user.role);
    }
    
    setFormData({ ...user, password: "", permissions: parsedPerms as any });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      username: "",
      password: "",
      name: "",
      role: "BRANCH_ADMIN",
      branchId: branches.length > 0 ? branches[0].id : "",
      permissions: getDefaultPermissions("BRANCH_ADMIN") as any,
      isActive: true,
    });
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengguna ini secara permanen?")) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!isEditMode && !payload.password) {
        alert("Password wajib diisi untuk pengguna baru!");
        setSaving(false);
        return;
      }
      if (isEditMode && !payload.password) {
        delete payload.password; // Don't send empty password on edit
      }

      const url = isEditMode ? `/api/users/${formData.id}` : "/api/users";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan pengguna");
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800",
    BRANCH_ADMIN: "bg-emerald-100 text-emerald-800",
    THERAPIST: "bg-emerald-100 text-emerald-800",
    CASHIER: "bg-amber-100 text-amber-800",
    INVESTOR: "bg-slate-100 text-slate-800",
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    BRANCH_ADMIN: "Admin Cabang",
    THERAPIST: "Terapis",
    CASHIER: "Kasir",
    INVESTOR: "Investor",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Manajemen Pengguna"
          description="Kelola akun karyawan, terapis, dan investor yang dapat login ke sistem."
          icon={Users}
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input 
                  type="text" 
                  placeholder="Cari nama/username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 text-sm backdrop-blur-md transition-all"
                />
              </div>
              <button 
                onClick={handleAddNew}
                className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
              >
                <Plus className="h-5 w-5" /> Tambah Pengguna
              </button>
            </div>
          }
        />

        {/* Modal Form */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  {isEditMode ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Username Login</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={isEditMode} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Password {isEditMode && <span className="text-gray-400 font-normal">(Kosongkan jika tidak ingin mengubah)</span>}</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!isEditMode} minLength={6} className="w-full px-3 py-2 pr-10 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Peran Akses (Role Utama)</label>
                  <select 
                    value={formData.role} 
                    onChange={e => {
                      const newRole = e.target.value as any;
                      setFormData({
                        ...formData, 
                        role: newRole,
                        permissions: getDefaultPermissions(newRole) as any
                      });
                    }} 
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="SUPER_ADMIN">Super Admin (Akses Penuh)</option>
                    <option value="BRANCH_ADMIN">Admin Cabang (Manajer)</option>
                    <option value="CASHIER">Kasir (Buku Pasien & POS)</option>
                    <option value="THERAPIST">Terapis (Jadwal & Slip Gaji)</option>
                    <option value="INVESTOR">Investor (Laporan Keuangan Saja)</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-bold text-gray-800">Ceklis Hak Akses Spesifik (Custom Permissions)</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map(perm => {
                      const currentPerms = formData.permissions as any as string[];
                      const isParentChecked = perm.submenus.every(sub => currentPerms.includes(sub.id));
                      const isIndeterminate = !isParentChecked && perm.submenus.some(sub => currentPerms.includes(sub.id));

                      return (
                        <div key={perm.id} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                          <label className="flex items-start gap-2.5 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={isParentChecked}
                              ref={el => { if (el) el.indeterminate = isIndeterminate }}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const subIds = perm.submenus.map(s => s.id);
                                if (checked) {
                                  // Add all children
                                  const newPerms = Array.from(new Set([...currentPerms, ...subIds]));
                                  setFormData({...formData, permissions: newPerms as any});
                                } else {
                                  // Remove all children
                                  const newPerms = currentPerms.filter(p => !subIds.includes(p));
                                  setFormData({...formData, permissions: newPerms as any});
                                }
                              }}
                              className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-primary"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm select-none ${(isParentChecked || isIndeterminate) ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                                {perm.label}
                              </span>
                            </div>
                          </label>
                          <div className="ml-6 mt-2 space-y-2">
                            {perm.submenus.map(sub => {
                              const isSubChecked = currentPerms.includes(sub.id);
                              return (
                                <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                                  <input 
                                    type="checkbox"
                                    checked={isSubChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      if (checked) {
                                        setFormData({...formData, permissions: [...currentPerms, sub.id] as any});
                                      } else {
                                        setFormData({...formData, permissions: currentPerms.filter(p => p !== sub.id) as any});
                                      }
                                    }}
                                    className="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-primary"
                                  />
                                  <span className={`text-xs select-none ${isSubChecked ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                                    {sub.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(formData.role !== "SUPER_ADMIN" && formData.role !== "INVESTOR") && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Cabang Penempatan</label>
                    <select value={formData.branchId || ""} onChange={e => setFormData({...formData, branchId: e.target.value})} required className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="">-- Pilih Cabang --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status Akun</label>
                  <select value={formData.isActive ? "true" : "false"} onChange={e => setFormData({...formData, isActive: e.target.value === "true"})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="true">Aktif (Bisa Login)</option>
                    <option value="false">Dinonaktifkan</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-6 mt-4 border-t">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold transition-colors">Batal</button>
                  <button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary/20">
                    {saving ? "Menyimpan..." : "Simpan Pengguna"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Tidak ada pengguna ditemukan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Pengguna</th>
                    <th className="p-4 font-semibold">Peran & Akses</th>
                    <th className="p-4 font-semibold">Cabang</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {user.permissions ? (
                            <span>
                              {(() => {
                                try {
                                  const perms = JSON.parse(user.permissions);
                                  return `${perms.length} Hak Akses`;
                                } catch(e) { return "Hak Akses Default"; }
                              })()}
                            </span>
                          ) : (
                            <span>Hak Akses Default</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700">
                        {(user.role === "SUPER_ADMIN" || user.role === "INVESTOR") ? (
                          <span className="text-gray-400">Semua Cabang</span>
                        ) : (
                          branches.find(b => b.id === user.branchId)?.name || "Tidak Diketahui"
                        )}
                      </td>
                      <td className="p-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(user)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.role !== "SUPER_ADMIN" && (
                            <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors" title="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
