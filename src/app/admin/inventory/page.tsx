"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Package, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/layout/PageHeader";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockAlert: number;
};

export default function AdminInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Forms states
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [itemFormData, setItemFormData] = useState({
    id: "",
    name: "",
    category: "Alat Medis",
    unit: "Pcs",
    currentStock: 0 as number | string,
    minStockAlert: 5 as number | string,
  });

  const [transactionData, setTransactionData] = useState({
    itemId: "",
    itemName: "",
    type: "IN",
    quantity: 1 as number | string,
    notes: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEditItem = (item: InventoryItem) => {
    setItemFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minStockAlert: item.minStockAlert,
    });
    setIsItemFormOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus barang ini beserta seluruh riwayat mutasinya?")) return;
    try {
      await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const openTransactionForm = (item: InventoryItem, type: "IN" | "OUT") => {
    setTransactionData({
      itemId: item.id,
      itemName: item.name,
      type,
      quantity: 1,
      notes: "",
    });
    setIsTransactionFormOpen(true);
  };

  const submitItemForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (itemFormData.id) {
        await fetch(`/api/inventory/${itemFormData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemFormData),
        });
      } else {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemFormData),
        });
      }
      setIsItemFormOpen(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const submitTransactionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/inventory/${transactionData.itemId}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: transactionData.type,
          quantity: transactionData.quantity,
          notes: transactionData.notes,
        }),
      });
      setIsTransactionFormOpen(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Inventaris & Gudang"
          description="Kelola stok barang dan peralatan klinik."
          icon={Package}
          rightContent={
            <button 
              onClick={() => {
                setItemFormData({ id: "", name: "", category: "Alat Medis", unit: "Pcs", currentStock: 0, minStockAlert: 5 });
                setIsItemFormOpen(true);
              }}
              className="bg-white text-indigo-900 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" /> Tambah Barang Baru
            </button>
          }
        />

        {/* Form Tambah/Edit Barang */}
        {isItemFormOpen && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">{itemFormData.id ? "Edit Barang" : "Tambah Barang Baru"}</h3>
            <form onSubmit={submitItemForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nama Barang</label>
                  <input type="text" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} required className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Kategori</label>
                  <select value={itemFormData.category} onChange={e => setItemFormData({...itemFormData, category: e.target.value})} className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary">
                    <option value="Alat Medis">Alat Medis</option>
                    <option value="Herbal & Obat">Herbal & Obat</option>
                    <option value="Perlengkapan Umum">Perlengkapan Umum</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Satuan</label>
                  <input type="text" value={itemFormData.unit} onChange={e => setItemFormData({...itemFormData, unit: e.target.value})} placeholder="Pcs, Box, Botol" required className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                </div>
                {!itemFormData.id && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Stok Awal</label>
                    <input type="number" min="0" value={itemFormData.currentStock} onChange={e => setItemFormData({...itemFormData, currentStock: e.target.value === "" ? "" : parseInt(e.target.value)})} required className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Batas Peringatan Minimum</label>
                  <input type="number" min="1" value={itemFormData.minStockAlert} onChange={e => setItemFormData({...itemFormData, minStockAlert: e.target.value === "" ? "" : parseInt(e.target.value)})} required className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setIsItemFormOpen(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 font-medium">Batal</button>
                <button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md font-medium flex items-center gap-2">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Form Mutasi Stok */}
        {isTransactionFormOpen && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 border-l-4 border-l-blue-500">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Catat Mutasi: {transactionData.itemName}</h3>
            <form onSubmit={submitTransactionForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Jenis Transaksi</label>
                  <select value={transactionData.type} onChange={e => setTransactionData({...transactionData, type: e.target.value as "IN"|"OUT"})} className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary">
                    <option value="IN">Stok Masuk (+)</option>
                    <option value="OUT">Stok Keluar (-)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Jumlah (Qty)</label>
                  <input type="number" min="1" value={transactionData.quantity} onChange={e => setTransactionData({...transactionData, quantity: e.target.value === "" ? "" : parseInt(e.target.value)})} required className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Catatan Keterangan (Opsional)</label>
                  <input type="text" value={transactionData.notes} onChange={e => setTransactionData({...transactionData, notes: e.target.value})} placeholder="Cth: Pembelian dari Supplier X, atau Pemakaian Harian" className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setIsTransactionFormOpen(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 font-medium">Batal</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2">
                  {saving ? "Memproses..." : "Simpan Mutasi"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Memuat data inventaris...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Gudang kosong. Silakan tambahkan barang.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                    <th className="px-6 py-4 font-semibold">Nama Barang</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold text-center">Sisa Stok</th>
                    <th className="px-6 py-4 font-semibold text-center">Mutasi Cepat</th>
                    <th className="px-6 py-4 font-semibold text-right">Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => {
                    const isLowStock = item.currentStock <= item.minStockAlert;
                    return (
                      <tr key={item.id} className={`transition-colors ${isLowStock ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {isLowStock && <div className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" /> Stok Tipis</div>}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          <span className="bg-gray-100 px-2.5 py-1 rounded-md">{item.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`text-lg font-bold ${isLowStock ? 'text-red-700' : 'text-gray-900'}`}>
                            {item.currentStock} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openTransactionForm(item, "IN")} className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded-md" title="Stok Masuk" disabled={isTransactionFormOpen}>
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                            <button onClick={() => openTransactionForm(item, "OUT")} className="bg-orange-100 text-orange-700 hover:bg-orange-200 p-1.5 rounded-md" title="Stok Keluar" disabled={isTransactionFormOpen}>
                              <ArrowDownRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-900 p-1 mx-1" title="Edit Master">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900 p-1 mx-1" title="Hapus Barang">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && items.length > 0 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(items.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
              totalItems={items.length} 
              itemsPerPage={itemsPerPage} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
