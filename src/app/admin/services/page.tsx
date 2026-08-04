"use client";

import { useState, useEffect } from "react";
import { Plus, Activity, Edit2, Trash2, X, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  globalCommission: number;
  isActive: boolean;
};

const CATEGORIES = [
  "Paket Treatment",
  "Mcu",
  "Refleksi",
  "Bekam",
  "Adds On"
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(CATEGORIES[0]);

  const [session, setSession] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "",
    globalCommission: "",
    category: "Paket Treatment",
    branchId: "ALL",
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, branchRes, sessionRes] = await Promise.all([
        fetch(`/api/services?all=false`),
        fetch("/api/branches"),
        fetch("/api/auth/session")
      ]);
      
      const json = await res.json();
      if (json.data) {
        setServices(json.data);
      }

      if (branchRes.ok) {
        const bJson = await branchRes.json();
        setBranches(bJson.data || []);
      }
      
      if (sessionRes.ok) {
        const sJson = await sessionRes.json();
        setSession(sJson.session);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      durationMinutes: "",
      globalCommission: "",
      category: "Paket Treatment",
      branchId: branches.length > 0 ? branches[0].id : "ALL",
      isActive: true,
    });
    setEditingId(null);
    setErrorMsg("");
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setFormData({
      name: s.name,
      description: s.description,
      price: s.price.toString(),
      durationMinutes: s.durationMinutes.toString(),
      globalCommission: s.globalCommission?.toString() || "0",
      category: s.category || "Paket Treatment",
      branchId: s.branchId || "ALL",
      isActive: s.isActive,
    });
    setEditingId(s.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          durationMinutes: Number(formData.durationMinutes),
          globalCommission: Number(formData.globalCommission),
          category: formData.category,
          branchId: formData.branchId === "ALL" ? null : formData.branchId,
          isActive: formData.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan layanan");
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus layanan ini secara permanen?")) return;

    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus layanan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <PageHeader
          title="Manajemen Layanan Terapi"
          description="Kelola data layanan terapi yang ditawarkan klinik Anda."
          icon={Activity}
          rightContent={
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Tambah Layanan
            </button>
          }
        />

        {/* Data List grouped by category (Accordion) */}
        <div className="space-y-4">
          {CATEGORIES.map((cat, catIndex) => {
            const filteredServices = services.filter(s => s.category === cat || (!s.category && cat === "Paket Treatment"));
            const isOpen = openCategory === cat;

            return (
              <div key={cat} className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 ${isOpen ? 'border-blue-200' : 'border-gray-100 hover:border-gray-200'}`} style={{ animationDelay: `${catIndex * 100}ms` }}>
                <button
                  onClick={() => setOpenCategory(isOpen ? null : cat)}
                  className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isOpen ? 'bg-blue-50/80' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isOpen ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
                      {filteredServices.length}
                    </div>
                    <h3 className={`font-bold text-lg ${isOpen ? 'text-blue-900' : 'text-gray-700'}`}>
                      {cat}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </button>

                {/* Accordion Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 border-t border-blue-100' : 'max-h-0 opacity-0'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                          <th className="px-6 py-4 font-semibold">Nama Layanan</th>
                          <th className="px-6 py-4 font-semibold">Harga</th>
                          <th className="px-6 py-4 font-semibold">Durasi</th>
                          <th className="px-6 py-4 font-semibold">Komisi (Rp)</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Sedang memuat data...</td></tr>
                        ) : filteredServices.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-8 text-center"><p className="text-gray-400 text-sm">Belum ada layanan di kategori ini</p></td></tr>
                        ) : (
                          filteredServices.map(s => (
                            <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{s.name}</div>
                                <p className="text-xs text-gray-500 truncate max-w-xs">{s.description}</p>
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-800">
                                Rp {s.price.toLocaleString('id-ID')}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {s.durationMinutes} Menit
                              </td>
                              <td className="px-6 py-4 font-medium text-blue-700">
                                Rp {(s.globalCommission || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${s.isActive ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                  {s.isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus Layanan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {errorMsg}
                  </div>
                )}
                <form id="serviceForm" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Layanan</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. Pijat Refleksi"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Penjelasan singkat layanan..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga (Rp)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="150000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durasi (Menit)</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Komisi Terapis (Rp)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formData.globalCommission}
                        onChange={(e) => setFormData({ ...formData, globalCommission: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="25000"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Layanan Aktif</span>
                    </label>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="serviceForm"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
