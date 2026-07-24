"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Settings, Users, Plus, Edit, Trash2, Shield, Store, Check, X, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("company"); // "company" | "admins"
  
  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Data States
  const [branches, setBranches] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  
  // Company Settings Form State
  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    heroBadgeText: "",
    heroTitle: "",
    heroDescription: "",
    operatingHours: "",
    operatingHoursWeekend: "",
    mapUrl: "",
    aboutPageContent: {
      heroBadge: "Mengenal Kami",
      heroTitle: "Tentang Navara Reflexology",
      heroDesc: "Menelusuri rekam jejak, visi besar, dan dedikasi kami dalam menghadirkan solusi kesehatan sunnah terbaik untuk Anda.",
      storyBadge: "5+ Tahun Pengalaman",
      storyTitle: "Solusi Teman Sehatku",
      storyP1: "Navara Reflexology didirikan dengan satu tujuan mulia: mempopulerkan pengobatan sunnah dengan mengawinkannya bersama standar medis modern dan profesionalisme tinggi.",
      storyP2: "Sejak cabang pertama kami melayani, kami terus meracik inovasi dalam terapi bekam dan pijat refleksi.",
      visiTitle: "Visi & Misi Kami",
      visiDesc: "Fondasi kokoh yang menggerakkan setiap langkah kami dalam memberikan layanan kesehatan.",
      visiText: "Menjadi jaringan klinik terapi bekam dan refleksi paling terpercaya di Indonesia...",
      misi1: "Memberikan pelayanan terapi level atas oleh barisan terapis bersertifikat profesional.",
      misi2: "Menjamin sterilisasi 100% tanpa kompromi pada setiap peralatan yang digunakan.",
      misi3: "Berperan aktif mengedukasi masyarakat tentang pentingnya menjaga gaya hidup sehat dan preventif.",
      stat1Value: "10k+",
      stat1Label: "Pasien Terbantu",
      stat2Value: "100%",
      stat2Label: "Higienis & Steril",
      stat3Value: "20+",
      stat3Label: "Terapis Ahli",
      stat4Value: "4",
      stat4Label: "Cabang Premium"
    }
  });

  // Admin User Form State
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    id: "",
    username: "",
    name: "",
    password: "",
    role: "BRANCH_ADMIN",
    branchId: "",
  });

  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Fetch Session
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData.session);

          // 2. Fetch Branches
          const branchesRes = await fetch("/api/branches");
          if (branchesRes.ok) {
            const branchesData = await branchesRes.json();
            setBranches(branchesData.data || []);
          }

          // 3. Fetch Admins if Super Admin
          if (sessionData.session.role === "SUPER_ADMIN") {
            fetchAdmins();
          }
        } else {
          router.push("/admin/login");
        }

        // 4. Fetch Company Settings
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setFormData({
            companyName: data.companyName || "",
            description: data.description || "",
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            whatsappNumber: data.whatsappNumber || "",
            facebookUrl: data.facebookUrl || "",
            instagramUrl: data.instagramUrl || "",
            youtubeUrl: data.youtubeUrl || "",
            heroBadgeText: data.heroBadgeText || "TERPERCAYA & PROFESIONAL",
            heroTitle: data.heroTitle || "Solusi Teman Sehatku",
            heroDescription: data.heroDescription || "Menghadirkan layanan pengobatan sunnah berkualitas tinggi dengan standar medis modern.",
            operatingHours: data.operatingHours || "09:00 - 21:00 WIB",
            operatingHoursWeekend: data.operatingHoursWeekend || "09:00 - 21:00 WIB",
            mapUrl: data.mapUrl || "",
            aboutPageContent: typeof data.aboutPageContent === 'string' 
                ? JSON.parse(data.aboutPageContent) 
                : (data.aboutPageContent || {
                  heroBadge: "Mengenal Kami",
                  heroTitle: "Tentang Navara Reflexology",
                  heroDesc: "Menelusuri rekam jejak, visi besar, dan dedikasi kami dalam menghadirkan solusi kesehatan sunnah terbaik untuk Anda.",
                  storyBadge: "5+ Tahun Pengalaman",
                  storyTitle: "Solusi Teman Sehatku",
                  storyP1: "Navara Reflexology didirikan dengan satu tujuan mulia: mempopulerkan pengobatan sunnah dengan mengawinkannya bersama standar medis modern dan profesionalisme tinggi.",
                  storyP2: "Sejak cabang pertama kami melayani, kami terus meracik inovasi dalam terapi bekam dan pijat refleksi.",
                  visiTitle: "Visi & Misi Kami",
                  visiDesc: "Fondasi kokoh yang menggerakkan setiap langkah kami dalam memberikan layanan kesehatan.",
                  visiText: "Menjadi jaringan klinik terapi bekam dan refleksi paling terpercaya di Indonesia...",
                  misi1: "Memberikan pelayanan terapi level atas oleh barisan terapis bersertifikat profesional.",
                  misi2: "Menjamin sterilisasi 100% tanpa kompromi pada setiap peralatan yang digunakan.",
                  misi3: "Berperan aktif mengedukasi masyarakat tentang pentingnya menjaga gaya hidup sehat dan preventif.",
                  stat1Value: "10k+",
                  stat1Label: "Pasien Terbantu",
                  stat2Value: "100%",
                  stat2Label: "Higienis & Steril",
                  stat3Value: "20+",
                  stat3Label: "Terapis Ahli",
                  stat4Value: "4",
                  stat4Label: "Cabang Premium"
                })
          });
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (res.ok) {
        setAdminsList(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      aboutPageContent: {
        ...formData.aboutPageContent,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setMessage({ text: "Pengaturan perusahaan berhasil disimpan!", type: "success" });
      } else {
        setMessage({ text: "Gagal menyimpan pengaturan perusahaan.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Terjadi kesalahan.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  // --- Admin Account Actions ---

  const handleOpenAddAdmin = () => {
    setAdminFormData({
      id: "",
      username: "",
      name: "",
      password: "",
      role: "BRANCH_ADMIN",
      branchId: branches[0]?.id || "",
    });
    setShowPassword(false);
    setIsAdminFormOpen(true);
  };

  const handleOpenEditAdmin = (admin: any) => {
    setAdminFormData({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      password: "", // Keep blank unless resetting
      role: admin.role,
      branchId: admin.branchId || "",
    });
    setShowPassword(false);
    setIsAdminFormOpen(true);
  };

  const handleToggleAdminStatus = async (admin: any) => {
    if (admin.id === session.id) {
      alert("Anda tidak dapat mengubah status aktif akun Anda sendiri.");
      return;
    }

    try {
      const res = await fetch(`/api/admins/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengubah status admin.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (id === session.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (!confirm("Hapus akun admin ini secara permanen?")) return;

    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdmins();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus admin.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Enforce branchId selection for BRANCH_ADMIN
    const payload = {
      ...adminFormData,
      branchId: adminFormData.role === "SUPER_ADMIN" ? null : adminFormData.branchId,
    };

    try {
      let res;
      if (adminFormData.id) {
        // Edit
        res = await fetch(`/api/admins/${adminFormData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Add
        if (!adminFormData.password) {
          alert("Password wajib diisi untuk admin baru.");
          setSaving(false);
          return;
        }
        res = await fetch("/api/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsAdminFormOpen(false);
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan akun admin.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Memuat halaman pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <PageHeader 
          title="Pengaturan Sistem"
          description="Kelola informasi kontak perusahaan dan akses pengguna admin."
          icon={Settings}
          rightContent={
            session?.role === "SUPER_ADMIN" ? (
              <div className="flex border border-white/20 bg-white/10 p-1 rounded-xl shadow-sm w-max mt-4 md:mt-0 backdrop-blur-md">
                <button
                  onClick={() => setActiveTab("company")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "company" ? "bg-white text-emerald-900 shadow-md" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                >
                  <Settings className="w-4 h-4" />
                  Info Perusahaan
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "about" ? "bg-white text-emerald-900 shadow-md" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                >
                  <Store className="w-4 h-4" />
                  Halaman About
                </button>
                <button
                  onClick={() => setActiveTab("admins")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "admins" ? "bg-white text-emerald-900 shadow-md" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                >
                  <Users className="w-4 h-4" />
                  Sesi Admin
                </button>
              </div>
            ) : undefined
          }
        />

        {/* Feedback Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl font-semibold text-sm border ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            {message.text}
          </div>
        )}

        {/* TAB 1: Company Settings */}
        {activeTab === "company" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <form onSubmit={handleCompanySubmit} className="p-6 md:p-8 space-y-8">
              
              {/* Profile Umum */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Store className="w-5 h-5 text-emerald-600" /> Profil Utama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Nama Perusahaan</label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Deskripsi Singkat (Footer)</label>
                    <textarea name="description" value={formData.description} onChange={handleCompanyChange} rows={2} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Alamat Kantor Pusat</label>
                    <textarea name="address" value={formData.address} onChange={handleCompanyChange} rows={2} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

              {/* Landing Page Content */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500" /> Konten Landing Page (Hero)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Teks Label Badge (Kecil)</label>
                    <input type="text" name="heroBadgeText" value={formData.heroBadgeText} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Judul Utama Hero</label>
                    <input type="text" name="heroTitle" value={formData.heroTitle} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Deskripsi Hero</label>
                    <textarea name="heroDescription" value={formData.heroDescription} onChange={handleCompanyChange} rows={3} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Store className="w-5 h-5 text-emerald-600" /> Kontak & Jam Operasional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">No. Telepon</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">WhatsApp (Angka Saja, Cth: 62812...)</label>
                    <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email Perusahaan</label>
                    <input type="email" name="email" value={formData.email} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Jam Operasional (Senin - Jumat)</label>
                    <input type="text" name="operatingHours" value={formData.operatingHours} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Jam Operasional (Sabtu - Minggu)</label>
                    <input type="text" name="operatingHoursWeekend" value={formData.operatingHoursWeekend} onChange={handleCompanyChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Sematkan URL GMaps Peta</label>
                    <input 
                      type="url" 
                      name="mapUrl" 
                      value={formData.mapUrl} 
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
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                    <p className="text-xs text-gray-500 font-medium mt-1">Gunakan link "Sematkan Peta (Embed a map)" dari Google Maps.</p>
                    {formData.mapUrl && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-2">Pratinjau Peta Google Maps</div>
                        <div className="h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
                           {formData.mapUrl.includes("embed") || formData.mapUrl.includes("output=embed") ? (
                             <iframe src={formData.mapUrl} className="absolute inset-0 w-full h-full border-0" loading="lazy"></iframe>
                           ) : (
                             <div className="w-full h-full text-red-500 flex items-center justify-center text-xs text-center p-4 font-semibold">
                               Link bukan format Embed. Peta tidak dapat ditampilkan.<br/>Harap gunakan fitur "Sematkan Peta".
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sosmed */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Store className="w-5 h-5 text-pink-500" /> Media Sosial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Facebook URL</label>
                    <input type="url" name="facebookUrl" value={formData.facebookUrl} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Instagram URL</label>
                    <input type="url" name="instagramUrl" value={formData.instagramUrl} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">YouTube URL</label>
                    <input type="url" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 1.5: About Page Settings */}
        {activeTab === "about" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <form onSubmit={handleCompanySubmit} className="p-6 md:p-8 space-y-8">
              
              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Store className="w-5 h-5 text-indigo-500" /> Teks Hero Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Hero Badge (Mengenal Kami)</label>
                    <input type="text" name="heroBadge" value={formData.aboutPageContent.heroBadge || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Hero Title (Tentang Navara...)</label>
                    <input type="text" name="heroTitle" value={formData.aboutPageContent.heroTitle || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Hero Description</label>
                    <textarea name="heroDesc" value={formData.aboutPageContent.heroDesc || ""} onChange={handleAboutChange} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
              </div>

              {/* Story Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500" /> Cerita Singkat (Story)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Teks Badge (Cth: 5+ Tahun Pengalaman)</label>
                    <input type="text" name="storyBadge" value={formData.aboutPageContent.storyBadge || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Judul Cerita (Solusi Teman Sehatku)</label>
                    <input type="text" name="storyTitle" value={formData.aboutPageContent.storyTitle || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Paragraf 1</label>
                    <textarea name="storyP1" value={formData.aboutPageContent.storyP1 || ""} onChange={handleAboutChange} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Paragraf 2</label>
                    <textarea name="storyP2" value={formData.aboutPageContent.storyP2 || ""} onChange={handleAboutChange} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
              </div>

              {/* Visi Misi Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Store className="w-5 h-5 text-blue-500" /> Visi & Misi</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Judul Bagian Visi Misi</label>
                    <input type="text" name="visiTitle" value={formData.aboutPageContent.visiTitle || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Deskripsi Singkat Visi Misi</label>
                    <input type="text" name="visiDesc" value={formData.aboutPageContent.visiDesc || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Teks Lengkap Visi</label>
                    <textarea name="visiText" value={formData.aboutPageContent.visiText || ""} onChange={handleAboutChange} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Misi Poin 1</label>
                    <input type="text" name="misi1" value={formData.aboutPageContent.misi1 || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Misi Poin 2</label>
                    <input type="text" name="misi2" value={formData.aboutPageContent.misi2 || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Misi Poin 3</label>
                    <input type="text" name="misi3" value={formData.aboutPageContent.misi3 || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2 text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-pink-500" /> Statistik</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Statistik 1 (Nilai)</label>
                    <input type="text" name="stat1Value" value={formData.aboutPageContent.stat1Value || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                    <input type="text" name="stat1Label" value={formData.aboutPageContent.stat1Label || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none mt-2" placeholder="Label" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Statistik 2 (Nilai)</label>
                    <input type="text" name="stat2Value" value={formData.aboutPageContent.stat2Value || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                    <input type="text" name="stat2Label" value={formData.aboutPageContent.stat2Label || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none mt-2" placeholder="Label" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Statistik 3 (Nilai)</label>
                    <input type="text" name="stat3Value" value={formData.aboutPageContent.stat3Value || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                    <input type="text" name="stat3Label" value={formData.aboutPageContent.stat3Label || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none mt-2" placeholder="Label" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Statistik 4 (Nilai)</label>
                    <input type="text" name="stat4Value" value={formData.aboutPageContent.stat4Value || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                    <input type="text" name="stat4Label" value={formData.aboutPageContent.stat4Label || ""} onChange={handleAboutChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none mt-2" placeholder="Label" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Menyimpan..." : "Simpan Teks About Us"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Admin Accounts (Super Admin Only) */}
        {activeTab === "admins" && session?.role === "SUPER_ADMIN" && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Daftar Admin Terdaftar</h3>
                <p className="text-gray-500 text-xs mt-0.5">Kelola akses akun admin cabang atau super admin.</p>
              </div>
              <button
                onClick={handleOpenAddAdmin}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Admin Baru
              </button>
            </div>

            {/* Form Modal */}
            {isAdminFormOpen && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 relative animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-500"></div>
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {adminFormData.id ? "Ubah Data Akun Admin" : "Buat Akun Admin Baru"}
                </h4>
                
                <form onSubmit={handleAdminFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={adminFormData.name}
                        onChange={e => setAdminFormData({...adminFormData, name: e.target.value})}
                        placeholder="Nama Pegawai"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Username (Untuk Login)</label>
                      <input
                        type="text"
                        required
                        disabled={!!adminFormData.id}
                        value={adminFormData.username}
                        onChange={e => setAdminFormData({...adminFormData, username: e.target.value})}
                        placeholder="username"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">
                        {adminFormData.id ? "Ganti Password (Kosongkan jika tidak diubah)" : "Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required={!adminFormData.id}
                          value={adminFormData.password}
                          onChange={e => setAdminFormData({...adminFormData, password: e.target.value})}
                          placeholder={adminFormData.id ? "Masukkan password baru" : "Buat password"}
                          className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Peran Hak Akses</label>
                      <select
                        value={adminFormData.role}
                        onChange={e => setAdminFormData({...adminFormData, role: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium"
                      >
                        <option value="BRANCH_ADMIN">Admin Cabang (Terbatas)</option>
                        <option value="SUPER_ADMIN">Super Admin (Akses Penuh)</option>
                      </select>
                    </div>

                    {adminFormData.role === "BRANCH_ADMIN" && (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">Tugaskan ke Cabang</label>
                        <select
                          required
                          value={adminFormData.branchId}
                          onChange={e => setAdminFormData({...adminFormData, branchId: e.target.value})}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium"
                        >
                          <option value="">-- Pilih Cabang Penempatan --</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAdminFormOpen(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2 rounded-xl text-sm transition-all"
                    >
                      {saving ? "Memproses..." : "Simpan Admin"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 font-bold">
                      <th className="px-6 py-4">Nama Lengkap</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Hak Akses</th>
                      <th className="px-6 py-4">Penempatan</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {adminsList.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{admin.name}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{admin.username}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${admin.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            <Shield className="w-3.5 h-3.5" />
                            {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin Cabang"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 font-medium flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-gray-400" />
                            {admin.role === "SUPER_ADMIN" ? (
                              <span className="text-gray-400 italic">Semua Cabang (Pusat)</span>
                            ) : (
                              admin.branchName || admin.branchId || "Tidak Ada Penempatan"
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleAdminStatus(admin)}
                            disabled={admin.id === session.id}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-50 ${admin.isActive ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
                          >
                            {admin.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {admin.isActive ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditAdmin(admin)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Profil/Password"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              disabled={admin.id === session.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
