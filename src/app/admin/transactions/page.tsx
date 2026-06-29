"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  Calendar,
  RefreshCw,
  Edit2,
  X,
  Save,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  User,
  Clock,
  Package,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  therapistName: string | null;
  branchName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  notes: string | null;
  createdAt: string;
  patientGender?: string | null;
  splitPayments?: { method: string; amount: number }[] | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const PAYMENT_METHODS = [
  { key: "ALL", label: "Semua", icon: Receipt, color: "bg-gray-100 text-gray-700 border-gray-200", activeColor: "bg-gray-800 text-white border-gray-800" },
  { key: "CASH", label: "Cash", icon: Banknote, color: "bg-emerald-50 text-emerald-700 border-emerald-200", activeColor: "bg-emerald-600 text-white border-emerald-600" },
  { key: "QRIS", label: "QRIS", icon: Smartphone, color: "bg-purple-50 text-purple-700 border-purple-200", activeColor: "bg-purple-600 text-white border-purple-600" },
  { key: "TRANSFER BANK", label: "Transfer Bank", icon: Building2, color: "bg-blue-50 text-blue-700 border-blue-200", activeColor: "bg-blue-600 text-white border-blue-600" },
  { key: "DEBIT", label: "Debit", icon: CreditCard, color: "bg-orange-50 text-orange-700 border-orange-200", activeColor: "bg-orange-500 text-white border-orange-500" },
];

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  CASH:     { label: "Cash",          cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  QRIS:     { label: "QRIS",          cls: "bg-purple-100 text-purple-700 border border-purple-200" },
  "TRANSFER BANK": { label: "Transfer Bank", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  DEBIT:    { label: "Debit",         cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  EWALLET:  { label: "E-Wallet",      cls: "bg-pink-100 text-pink-700 border border-pink-200" },
  SPLIT:    { label: "Split Payment", cls: "bg-indigo-100 text-indigo-700 border border-indigo-200" },
};

function fmtRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

// ─────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────
function EditModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: (updated: Invoice) => void;
}) {
  const [form, setForm] = useState({
    paymentMethod: invoice.paymentMethod,
    amountPaid: invoice.amountPaid,
    discount: invoice.discount,
    tax: invoice.tax,
    notes: invoice.notes || "",
    patientName: invoice.patientName,
    patientPhone: invoice.patientPhone,
    therapistName: invoice.therapistName || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const grandTotal = invoice.subtotal - form.discount + form.tax;
  const changeAmount = Math.max(0, form.amountPaid - grandTotal);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      onSaved(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Transaksi</h2>
            <p className="text-xs text-gray-500 mt-0.5">{invoice.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info readonly */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-700">{fmtRp(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Grand Total</span>
              <span className="font-bold text-gray-900 text-base">{fmtRp(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Kembalian</span>
              <span className="font-medium text-emerald-600">{fmtRp(changeAmount)}</span>
            </div>
          </div>

          {/* Patient */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Pasien</label>
              <input
                type="text"
                value={form.patientName}
                onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">No. Telepon</label>
              <input
                type="text"
                value={form.patientPhone}
                onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>
          </div>

          {/* Therapist */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Terapis</label>
            <input
              type="text"
              value={form.therapistName}
              onChange={e => setForm(f => ({ ...f, therapistName: e.target.value }))}
              placeholder="Kosongkan jika tidak ada"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Diskon (Rp)</label>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pajak (Rp)</label>
              <input
                type="number"
                min="0"
                value={form.tax}
                onChange={e => setForm(f => ({ ...f, tax: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.filter(m => m.key !== "ALL").map(m => {
                const Icon = m.icon;
                const active = form.paymentMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, paymentMethod: m.key }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      active ? m.activeColor + " shadow-sm scale-[1.02]" : m.color + " hover:opacity-80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jumlah Dibayar (Rp)</label>
            <input
              type="number"
              min="0"
              value={form.amountPaid}
              onChange={e => setForm(f => ({ ...f, amountPaid: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Catatan</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Tambahkan catatan..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Row Detail Expand
// ─────────────────────────────────────────────
function InvoiceRow({ invoice, onEdit }: { invoice: Invoice; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const badge = PAYMENT_BADGE[invoice.paymentMethod] ?? { label: invoice.paymentMethod, cls: "bg-gray-100 text-gray-600 border border-gray-200" };

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="text-xs font-mono font-semibold text-emerald-700">{invoice.invoiceNumber}</div>
          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtTime(invoice.createdAt)}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">{invoice.patientName}</div>
          <div className="text-xs text-gray-400">{invoice.patientPhone}</div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="text-sm text-gray-700">
            {((invoice.items as unknown as InvoiceItem[]) || [])
              .map(i => i.name)
              .join(", ")}
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <div className="text-sm text-gray-600 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {invoice.therapistName || <span className="text-gray-300">—</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="text-sm font-bold text-gray-900">{fmtRp(invoice.grandTotal)}</div>
          {invoice.discount > 0 && (
            <div className="text-[11px] text-red-500">-{fmtRp(invoice.discount)}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
              title="Edit transaksi"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              title="Detail"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-emerald-50/40 border-b border-emerald-100">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Items */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Detail Layanan
                </p>
                <div className="space-y-1.5">
                  {((invoice.items as unknown as InvoiceItem[]) || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.name}
                        {item.qty > 1 && <span className="text-gray-400 ml-1">×{item.qty}</span>}
                      </span>
                      <span className="font-semibold text-gray-800">{fmtRp(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment detail */}
              <div className="space-y-1.5 text-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rincian Pembayaran</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700">{fmtRp(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diskon</span>
                    <span className="text-red-600">-{fmtRp(invoice.discount)}</span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pajak</span>
                    <span className="text-gray-700">+{fmtRp(invoice.tax)}</span>
                  </div>
                )}
                {invoice.paymentMethod === "SPLIT" && invoice.splitPayments && invoice.splitPayments.length > 0 && (
                  <div className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg space-y-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Split Payment Breakdown</p>
                    {invoice.splitPayments.map((sp, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-indigo-600 font-medium">{sp.method}</span>
                        <span className="text-indigo-800 font-bold">{fmtRp(sp.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-gray-900">{fmtRp(invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dibayar</span>
                  <span className="text-gray-700">{fmtRp(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kembalian</span>
                  <span className="text-emerald-600 font-semibold">{fmtRp(invoice.changeAmount)}</span>
                </div>
                {invoice.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                    📝 {invoice.notes}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TransaksiPelangganPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [activeMethod, setActiveMethod] = useState("ALL");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/invoices?date=${date}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        const data = (json.data || []).map((inv: Invoice) => ({
          ...inv,
          items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items,
          splitPayments: typeof inv.splitPayments === "string" ? JSON.parse(inv.splitPayments) : inv.splitPayments,
        }));
        setInvoices(data);
      }
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSaved(updated: Invoice) {
    setInvoices(prev => prev.map(inv => (inv.id === updated.id ? updated : inv)));
    setEditTarget(null);
    showToast("success", "Transaksi berhasil diperbarui");
  }

  // Filtered list
  const filtered = invoices.filter(inv => {
    const isSplitMatch = inv.paymentMethod === "SPLIT" && inv.splitPayments?.some(sp => sp.method === activeMethod);
    const matchMethod = activeMethod === "ALL" || inv.paymentMethod === activeMethod || isSplitMatch;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      inv.patientName.toLowerCase().includes(q) ||
      inv.patientPhone.includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.therapistName || "").toLowerCase().includes(q);
    return matchMethod && matchSearch;
  });

  // Summary per method
  const summary = PAYMENT_METHODS.filter(m => m.key !== "ALL").map(m => {
    let total = 0;
    let count = 0;
    
    invoices.forEach(inv => {
      if (inv.paymentMethod === m.key) {
        total += inv.grandTotal;
        count += 1;
      } else if (inv.paymentMethod === "SPLIT" && inv.splitPayments) {
        const split = inv.splitPayments.find(sp => sp.method === m.key);
        if (split) {
          total += split.amount;
          count += 1;
        }
      }
    });

    return {
      ...m,
      total,
      count
    };
  });

  const grandTotalAll = filtered.reduce((s, inv) => s + inv.grandTotal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 duration-200 ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-emerald-600 rounded-xl shadow-md">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Transaksi Pelanggan</h1>
            <p className="text-sm text-gray-500">Riwayat & detail seluruh transaksi pembayaran</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition cursor-pointer"
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama pasien, no. HP, atau no. invoice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {summary.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setActiveMethod(prev => prev === m.key ? "ALL" : m.key)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 shadow-sm hover:shadow-md ${
                activeMethod === m.key
                  ? m.activeColor + " scale-[1.02] shadow-md"
                  : "bg-white border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${activeMethod === m.key ? "text-white/90" : "text-gray-400"}`} />
                <span className={`text-xs font-bold uppercase tracking-wide ${activeMethod === m.key ? "text-white/80" : "text-gray-400"}`}>
                  {m.label}
                </span>
              </div>
              <div className={`text-lg font-extrabold ${activeMethod === m.key ? "text-white" : "text-gray-800"}`}>
                {fmtRp(m.total)}
              </div>
              <div className={`text-xs mt-0.5 ${activeMethod === m.key ? "text-white/70" : "text-gray-400"}`}>
                {m.count} transaksi
              </div>
            </button>
          );
        })}
      </div>

      {/* Payment Method Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {PAYMENT_METHODS.map(m => {
          const Icon = m.icon;
          const active = activeMethod === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setActiveMethod(m.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 ${
                active ? m.activeColor + " shadow-sm" : m.color + " hover:opacity-80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
              {m.key !== "ALL" && (
                <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 font-bold ${active ? "bg-white/20" : "bg-black/5"}`}>
                  {invoices.filter(inv => inv.paymentMethod === m.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table header summary */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-sm font-bold text-gray-700">{filtered.length} transaksi</span>
              <span className="text-gray-400 text-sm ml-2">
                — {new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                <User className="w-3.5 h-3.5" /> Laki-laki: {filtered.filter(i => i.patientGender === 'L').length}
              </span>
              <span className="flex items-center gap-1.5 text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                <User className="w-3.5 h-3.5" /> Perempuan: {filtered.filter(i => i.patientGender === 'P').length}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-lg font-extrabold text-emerald-700">{fmtRp(grandTotalAll)}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Memuat data transaksi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Receipt className="w-12 h-12 text-gray-200 mb-3" />
            <p className="font-semibold text-gray-500">Tidak ada transaksi</p>
            <p className="text-sm mt-1">
              {search ? "Coba kata kunci lain" : `Belum ada transaksi pada ${new Date(date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">No. Invoice / Waktu</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Layanan</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Terapis</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Metode</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    onEdit={() => setEditTarget(inv)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          invoice={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
