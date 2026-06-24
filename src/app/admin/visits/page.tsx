"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, CalendarCheck, Search, User, Phone, MapPin, Activity, Store, 
  UserCheck, Calendar, Clock, FileText, X, ChevronDown, Users, TrendingUp, 
  Check, Receipt, Printer, MessageCircle, Link2, Download, AlertCircle, 
  Minus, Trash2, Copy, Edit, CheckCircle2 
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/layout/PageHeader";


type PatientVisit = {
  id: string;
  patientId: string;
  serviceId: string;
  branchId: string;
  therapistId: string | null;
  visitDate: string;
  visitTime: string;
  notes: string | null;
  status: "completed" | "cancelled";
  paymentStatus: "UNPAID" | "PAID";
  createdAt: string;
};

type Patient = { id: string; name: string; phone: string };
type Therapist = { id: string; name: string; branchId: string | null };
type Branch = { id: string; name: string; address?: string; phone?: string };
type Service = { id: string; name: string; price?: number; category?: string };

type InvoiceItem = {
  serviceId: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  therapistName: string | null;
  branchName: string;
  items: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  createdAt: string;
};

export default function AdminVisitsPage() {
  const router = useRouter();

  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Dropdown states
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // POS Visit Integration
  const [posVisitId, setPosVisitId] = useState<string | null>(null);
  const [posModalOpen, setPosModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    address: "",
    gender: "L",
    serviceId: "",
    branchId: "",
    therapistId: "",
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    notes: "",
    status: "completed",
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Tab & Recap States
  const [activeTab, setActiveTab] = useState("list"); // "list" | "recap"
  const [recapDate, setRecapDate] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
  const [recapData, setRecapData] = useState<any>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapSubTab, setRecapSubTab] = useState<"daily" | "monthly">("daily");
  const [recapMonth, setRecapMonth] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).substring(0, 7));
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Pagination Reset Effect
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBranchId, activeTab]);

  // POS (Kasir) Tab States
  const [posPhone, setPosPhone] = useState("");
  const [posPatientName, setPosPatientName] = useState("");
  const [posBranchId, setPosBranchId] = useState("");
  const [posTherapistId, setPosTherapistId] = useState("");
  const [posItems, setPosItems] = useState<InvoiceItem[]>([]);
  const [posDiscount, setPosDiscount] = useState(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState("CASH");
  const [posAmountPaid, setPosAmountPaid] = useState(0);
  const [posNotes, setPosNotes] = useState("");
  const [posProcessing, setPosProcessing] = useState(false);
  const [posCreatedInvoice, setPosCreatedInvoice] = useState<{ id: string; invoiceNumber: string; grandTotal: number; changeAmount: number } | null>(null);

  // Invoice History States
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [historyDate, setHistoryDate] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState("ALL");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const existing = patients.find(p => p.phone === val);
    if (existing) {
      setFormData(prev => ({
        ...prev,
        phone: val,
        name: existing.name,
      }));
    } else {
      setFormData(prev => ({ ...prev, phone: val }));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resVisits, resPatients, resTherapists, resBranches, resServices, resSession] = await Promise.all([
        fetch("/api/patient-visits"),
        fetch("/api/patients"),
        fetch("/api/therapists"),
        fetch("/api/branches"),
        fetch("/api/services"),
        fetch("/api/auth/session")
      ]);
      if (resVisits.ok) setVisits((await resVisits.json()).data || []);
      if (resPatients.ok) setPatients((await resPatients.json()).data || []);
      if (resTherapists.ok) setTherapists(await resTherapists.json() || []);
      if (resBranches.ok) setBranches((await resBranches.json()).data || []);
      if (resServices.ok) setServices((await resServices.json()).data || []);
      if (resSession.ok) {
        const sessionData = await resSession.json();
        setSession(sessionData.session);
        if (sessionData.session.role === "BRANCH_ADMIN") {
          setFormData(prev => ({ ...prev, branchId: sessionData.session.branchId || "" }));
          setPosBranchId(sessionData.session.branchId || "");
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecap = useCallback(async (date: string) => {
    setRecapLoading(true);
    try {
      const res = await fetch(`/api/patient-visits/daily-recap?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setRecapData(json);
      }
    } catch (err) {
      console.error("Failed to fetch daily recap:", err);
    } finally {
      setRecapLoading(false);
    }
  }, []);

  const fetchMonthlyRecap = useCallback(async (month: string) => {
    setMonthlyLoading(true);
    try {
      const res = await fetch(`/api/patient-visits/monthly-recap?month=${month}`);
      if (res.ok) {
        const json = await res.json();
        setMonthlyData(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch monthly recap:", err);
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  const fetchInvoiceHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/invoices?date=${historyDate}`);
      if (res.ok) {
        const data = await res.json();
        setInvoiceHistory(data.data || []);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyDate]);

  useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoiceHistory();
    }
  }, [activeTab, historyDate, fetchInvoiceHistory]);
  const retentionPatients = useMemo(() => {
    const today = new Date();
    // 14 days in milliseconds
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    
    // Create a map of patient's latest visit
    const latestVisits = new Map<string, Date>();
    visits.forEach(v => {
      const visitDate = new Date(v.visitDate);
      if (!latestVisits.has(v.patientId) || visitDate > latestVisits.get(v.patientId)!) {
        latestVisits.set(v.patientId, visitDate);
      }
    });

    const retentionList: Array<{patient: any, lastVisitDate: Date, daysSinceLastVisit: number}> = [];

    patients.forEach(p => {
      const lastVisit = latestVisits.get(p.id);
      if (lastVisit) {
        const diffMs = today.getTime() - lastVisit.getTime();
        if (diffMs > fourteenDaysMs) {
          retentionList.push({
            patient: p,
            lastVisitDate: lastVisit,
            daysSinceLastVisit: Math.floor(diffMs / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    // Sort by days since last visit descending (longest absent first)
    return retentionList.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }, [visits, patients]);

  const handlePOSPhoneChange = (val: string) => {
    setPosPhone(val);
    const existing = patients.find(p => p.phone === val);
    if (existing) {
      setPosPatientName(existing.name);
    }
  };

  const addPOSItem = (serviceId: string) => {
    if (!serviceId) return;
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;

    const existing = posItems.find(i => i.serviceId === serviceId);
    if (existing) {
      setPosItems(posItems.map(i => 
        i.serviceId === serviceId 
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * (svc.price || 0) }
          : i
      ));
    } else {
      setPosItems([...posItems, {
        serviceId,
        name: svc.name,
        qty: 1,
        price: svc.price || 0,
        subtotal: svc.price || 0,
      }]);
    }
  };

  const removePOSItem = (serviceId: string) => {
    setPosItems(posItems.filter(i => i.serviceId !== serviceId));
  };

  const updatePOSItemQty = (serviceId: string, qty: number) => {
    if (qty <= 0) {
      removePOSItem(serviceId);
      return;
    }
    const svc = services.find(s => s.id === serviceId);
    setPosItems(posItems.map(i =>
      i.serviceId === serviceId
        ? { ...i, qty, subtotal: qty * (svc?.price || i.price || 0) }
        : i
    ));
  };

  const posSubtotal = posItems.reduce((sum, i) => sum + i.subtotal, 0);
  const posGrandTotal = posSubtotal - posDiscount;
  const posChangeAmount = Math.max(0, posAmountPaid - posGrandTotal);

  const handlePOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posItems.length === 0) return alert("Tambahkan minimal 1 item layanan!");
    if (!posPhone || !posPatientName || !posBranchId) return alert("Lengkapi data pasien & cabang!");
    if (posAmountPaid < posGrandTotal) return alert("Uang diterima kurang dari total!");

    setPosProcessing(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: posPhone,
          patientName: posPatientName,
          branchId: posBranchId,
          therapistId: posTherapistId || null,
          items: posItems,
          discount: posDiscount,
          tax: 0,
          paymentMethod: posPaymentMethod,
          amountPaid: posAmountPaid,
          notes: posNotes || null,
          visitId: posVisitId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosCreatedInvoice(data.data);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal membuat struk");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setPosProcessing(false);
    }
  };

  const resetPOSForm = () => {
    setPosPhone("");
    setPosPatientName("");
    setPosTherapistId("");
    setPosItems([]);
    setPosDiscount(0);
    setPosPaymentMethod("CASH");
    setPosAmountPaid(0);
    setPosNotes("");
    setPosCreatedInvoice(null);
    setPosVisitId(null);
    setPosModalOpen(false);
  };

  const handleSendWA = (invoiceId: string) => {
    window.open(`/receipt/${invoiceId}?wa=1`, "_blank");
  };

  const handlePrint = (invoiceId: string) => {
    window.open(`/receipt/${invoiceId}?print=1`, "_blank");
  };
  const handleCopyLink = (invoiceId: string) => {
    const url = `${window.location.origin}/receipt/${invoiceId}`;
    navigator.clipboard.writeText(url);
    alert("Link struk berhasil disalin!");
  };

  const handleExportCSV = () => {
    window.open(`/api/invoices/export?date=${historyDate}`, "_blank");
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "pos" || tab === "invoices" || tab === "list" || tab === "recap") {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (activeTab === "recap") {
      if (recapSubTab === "daily") {
        fetchRecap(recapDate);
      } else {
        fetchMonthlyRecap(recapMonth);
      }
    }
  }, [activeTab, recapSubTab, recapDate, recapMonth, fetchRecap, fetchMonthlyRecap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) return alert("Pilih minimal 1 layanan!");
    setSaving(true);
    try {
      const primaryServiceId = selectedServices[0];
      const extraServiceNames = selectedServices.slice(1).map(id => services.find(s => s.id === id)?.name).join(", ");
      const finalNotes = extraServiceNames ? `${formData.notes ? formData.notes + '\n\n' : ''}Layanan Tambahan: ${extraServiceNames}` : formData.notes;

      await fetch("/api/patient-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          serviceId: primaryServiceId,
          notes: finalNotes
        }),
      });
      setIsFormOpen(false);
      setFormData(prev => ({
        ...prev,
        phone: "", name: "", address: "", notes: ""
      }));
      setSelectedServices([]);
      fetchData();
      if (activeTab === "recap") {
        if (recapSubTab === "daily") {
          fetchRecap(recapDate);
        } else {
          fetchMonthlyRecap(recapMonth);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPOSForVisit = (
    visitId: string,
    patientId: string,
    branchId: string,
    therapistId: string | null,
    serviceId: string
  ) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setPosPhone(patient.phone);
      setPosPatientName(patient.name);
    }
    
    setPosBranchId(branchId);
    setPosTherapistId(therapistId || "");
    
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setPosItems([{
        serviceId: service.id,
        name: service.name,
        qty: 1,
        price: service.price || 0,
        subtotal: service.price || 0,
      }]);
    } else {
      setPosItems([]);
    }
    
    setPosVisitId(visitId);
    setPosModalOpen(true);
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;
  const getTherapistName = (id: string | null) => {
    if (!id) return "-";
    return therapists.find(t => t.id === id)?.name || id;
  };
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || id;
  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || id;

  const getVisitSequenceNumber = (patientId: string, visitId: string) => {
    const patientVisits = visits.filter(v => v.patientId === patientId);
    const index = patientVisits.findIndex(v => v.id === visitId);
    return patientVisits.length - index;
  };

  let finalVisits = visits.filter(v => {
    const matchBranch = selectedBranchId === "ALL" || v.branchId === selectedBranchId;
    const patientName = getPatientName(v.patientId).toLowerCase();
    const matchSearch = patientName.includes(searchQuery.toLowerCase());
    return matchBranch && matchSearch;
  });

  const totalPages = Math.ceil(finalVisits.length / itemsPerPage);
  const paginatedVisits = finalVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderPOSFormContent = () => (
    <>
      {!posCreatedInvoice ? (
<form onSubmit={handlePOSSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Patient & Service Selection */}
              <div className="lg:col-span-7 space-y-6 animate-in fade-in duration-300">
                {/* Patient Info Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" /> Data Pasien
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">No. Telepon / WA</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={posPhone}
                            onChange={e => handlePOSPhoneChange(e.target.value)}
                            placeholder="08123..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        {patients.find(p => p.phone === posPhone) && (
                          <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Pasien terdaftar</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Nama Pasien</label>
                        <input
                          type="text"
                          required
                          value={posPatientName}
                          onChange={e => setPosPatientName(e.target.value)}
                          placeholder="Nama lengkap"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Cabang</label>
                        <div className="relative">
                          <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <select
                            required
                            value={posBranchId}
                            onChange={e => setPosBranchId(e.target.value)}
                            disabled={session?.role === "BRANCH_ADMIN"}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                          >
                            <option value="">Pilih Cabang</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Terapis</label>
                        <select
                          value={posTherapistId}
                          onChange={e => setPosTherapistId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                        >
                          <option value="">Pilih Terapis (opsional)</option>
                          {therapists.filter(t => !posBranchId || t.branchId === posBranchId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        {!posTherapistId && (
                          <p className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Terapis belum dipilih — komisi tidak akan dicatat otomatis.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Selection Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-teal-600" /> Pilih Layanan
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="relative mb-4">
                      <select
                        onChange={e => { addPOSItem(e.target.value); e.target.value = ""; }}
                        value=""
                        className="w-full px-4 py-3 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">+ Tambah Layanan / Treatment</option>
                        {["Paket Treatment", "Full Body Massages", "Refleksi", "Bekam", "Adds On"].map(cat => {
                          const catServices = services.filter(s => s.category === cat || (!s.category && cat === "Paket Treatment"));
                          if (catServices.length === 0) return null;
                          return (
                            <optgroup key={cat} label={cat}>
                              {catServices.map(s => <option key={s.id} value={s.id}>{s.name} - {formatRupiah(s.price || 0)}</option>)}
                            </optgroup>
                          );
                        })}
                        {/* Fallback */}
                        {services.filter(s => !s.category && !s.name.toLowerCase().includes("bekam")).length > 0 && (
                          <optgroup label="Lainnya">
                            {services.filter(s => !s.category && !s.name.toLowerCase().includes("bekam")).map(s => (
                              <option key={s.id} value={s.id}>{s.name} - {formatRupiah(s.price || 0)}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {posItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada item. Pilih layanan di atas.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {posItems.map(item => (
                          <div key={item.serviceId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">{formatRupiah(item.price)} / item</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => updatePOSItemQty(item.serviceId, item.qty - 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                              <button type="button" onClick={() => updatePOSItemQty(item.serviceId, item.qty + 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="font-bold text-gray-900 text-sm w-24 text-right">{formatRupiah(item.subtotal)}</p>
                            <button type="button" onClick={() => removePOSItem(item.serviceId)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Payment Summary */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-6">
                  <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      💰 Ringkasan Pembayaran
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({posItems.length} item)</span>
                      <span className="font-semibold text-gray-900">{formatRupiah(posSubtotal)}</span>
                    </div>

                    {/* Discount */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Diskon (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        value={posDiscount || ""}
                        onChange={e => setPosDiscount(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                      />
                    </div>

                    {posDiscount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Diskon</span>
                        <span>- {formatRupiah(posDiscount)}</span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-extrabold text-gray-900">TOTAL</span>
                        <span className="text-2xl font-extrabold text-emerald-600">{formatRupiah(posGrandTotal)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Metode Pembayaran</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                          { value: "CASH", label: "💵 Cash" },
                          { value: "DEBIT", label: "💳 Debit" },
                          { value: "QRIS", label: "📱 QRIS" },
                          { value: "TRANSFER BANK", label: "🏦 Transfer" },
                        ].map(m => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setPosPaymentMethod(m.value)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                              posPaymentMethod === m.value
                                ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Paid */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Uang Diterima (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={posAmountPaid || ""}
                        onChange={e => setPosAmountPaid(parseInt(e.target.value) || 0)}
                        placeholder="Masukkan nominal..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                      {/* Quick amount buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {[posGrandTotal, 50000, 100000, 150000, 200000].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amount => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setPosAmountPaid(amount)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                          >
                            {formatRupiah(amount)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Change */}
                    {posAmountPaid >= posGrandTotal && posAmountPaid > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-emerald-700">Kembalian</span>
                          <span className="text-xl font-extrabold text-emerald-700">{formatRupiah(posChangeAmount)}</span>
                        </div>
                      </div>
                    )}

                    {posAmountPaid > 0 && posAmountPaid < posGrandTotal && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" /> Uang diterima kurang {formatRupiah(posGrandTotal - posAmountPaid)}
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Catatan</label>
                      <textarea
                        value={posNotes}
                        onChange={e => setPosNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors text-sm"
                        placeholder="Catatan tambahan (opsional)"
                      ></textarea>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={posProcessing || posItems.length === 0 || posAmountPaid < posGrandTotal}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {posProcessing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Proses & Bayar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
      ) : (
<div className="max-w-lg mx-auto animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden text-center">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-10 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold">Pembayaran Berhasil!</h3>
                <p className="text-emerald-100 mt-2 font-medium">{posCreatedInvoice.invoiceNumber}</p>
                <p className="text-3xl font-extrabold mt-3">{formatRupiah(posCreatedInvoice.grandTotal)}</p>
                {posCreatedInvoice.changeAmount > 0 && (
                  <p className="text-emerald-100 mt-1">Kembalian: {formatRupiah(posCreatedInvoice.changeAmount)}</p>
                )}
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => handlePrint(posCreatedInvoice.id)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <Printer className="w-5 h-5" /> Cetak Struk
                </button>
                <button
                  onClick={() => {
                    const branch = branches.find(b => b.id === posBranchId);
                    handleSendWA(posCreatedInvoice.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <MessageCircle className="w-5 h-5" /> Kirim via WhatsApp
                </button>
                <button
                  onClick={() => handleCopyLink(posCreatedInvoice.id)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-xl font-semibold border border-blue-200 transition-colors"
                >
                  <Copy className="w-5 h-5" /> Salin Link Struk
                </button>
                <button
                  onClick={resetPOSForm}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 font-medium text-sm transition-colors"
                >
                  Buat Struk Baru →
                </button>
              </div>
            </div>
          </div>
      )}
    </>
  );

  const filteredInvoiceHistory = invoiceHistory.filter(inv => {
    if (historyPaymentFilter === "ALL") return true;
    return inv.paymentMethod === historyPaymentFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <PageHeader 
          title="Buku Pasien"
          description="Catat dan pantau seluruh riwayat kunjungan pasien klinik."
          icon={CalendarCheck}
          rightContent={
            (activeTab === "list" || activeTab === "recap") ? (
              <button
                onClick={() => setIsFormOpen(true)}
                className="group bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-200 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" /> 
                Catat Kunjungan
              </button>
            ) : undefined
          }
        />

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 mb-8 bg-white p-1 rounded-xl shadow-sm w-max">
          <button
            onClick={() => handleTabChange("list")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "list" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <CalendarCheck className="w-4 h-4" />
            Daftar Kunjungan
          </button>
          <button
            onClick={() => handleTabChange("recap")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "recap" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <FileText className="w-4 h-4" />
            Rekap Pasien
          </button>
          <button
            onClick={() => handleTabChange("pos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "pos" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <Plus className="w-4 h-4" />
            Kasir POS
          </button>
          <button
            onClick={() => handleTabChange("invoices")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "invoices" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <Receipt className="w-4 h-4" />
            Riwayat Struk
          </button>
          <button
            onClick={() => handleTabChange("retention")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "retention" ? "bg-orange-500 text-white shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
          >
            <MessageCircle className="w-4 h-4" />
            Follow-up & Retensi
            {retentionPatients.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
                {retentionPatients.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Modal / Dropdown Area */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-0 w-full max-w-5xl max-h-[90vh] overflow-y-auto relative transform transition-all animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 z-10"></div>
              
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Catat Kunjungan Baru</h3>
                <p className="text-sm text-gray-500 mt-1">Lengkapi data pasien dan rincian layanan kunjungan.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Kolom Kiri: Data Pasien */}
                <div className="lg:col-span-5 space-y-5">
                  <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4"/> Data Pasien
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Nomor Telepon/WA</label>
                    <div className="relative">
                      <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" required value={formData.phone} onChange={handlePhoneChange} placeholder="Misal: 08123..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors" />
                    </div>
                    {patients.find(p => p.phone === formData.phone) && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><UserCheck className="w-3 h-3"/> Pasien terdaftar ditemukan.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors" placeholder="Nama Pasien" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Jenis Kelamin</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border cursor-pointer transition-all ${formData.gender === 'L' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" name="gender" value="L" checked={formData.gender === 'L'} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                        Laki-laki
                      </label>
                      <label className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border cursor-pointer transition-all ${formData.gender === 'P' ? 'bg-pink-50 border-pink-200 text-pink-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" name="gender" value="P" checked={formData.gender === 'P'} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Alamat</label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                      <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors" placeholder="Detail alamat..."></textarea>
                    </div>
                  </div>
                </div>

                {/* Divider Line Mobile */}
                <div className="lg:hidden border-b border-gray-100"></div>
                <div className="hidden lg:block lg:col-span-1 border-r border-gray-100 mx-auto h-full"></div>

                {/* Kolom Kanan: Rincian Layanan */}
                <div className="lg:col-span-6 space-y-5">
                  <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4"/> Rincian Layanan
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Layanan</label>
                      <div className="relative">
                        <div className="relative" ref={serviceDropdownRef}>
                          <div 
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer flex items-center justify-between transition-colors hover:bg-gray-100"
                          >
                            <div className="flex items-center text-gray-700 w-full overflow-hidden">
                              <Activity className="absolute left-3 h-4 w-4 text-gray-400" />
                              <span className={selectedServices.length === 0 ? "text-gray-500 text-sm" : "text-gray-700 text-sm font-medium truncate pr-4"}>
                                {selectedServices.length === 0 
                                  ? "Pilih Layanan (Maks 3)" 
                                  : selectedServices.map(id => services.find(s => s.id === id)?.name).join(", ")}
                              </span>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>

                          {isServiceDropdownOpen && (
                            <div className="absolute z-50 w-[150%] md:w-[200%] max-w-[300px] mt-2 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                              <div className="p-3 border-b border-gray-100 bg-slate-50/50 sticky top-0 z-10">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <input 
                                    type="text"
                                    placeholder="Cari layanan..."
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              
                              <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                                {["Paket Treatment", "Full Body Massages", "Refleksi", "Bekam", "Adds On", "Lainnya"].map(cat => {
                                  const catServices = services.filter(s => {
                                    if (cat === "Lainnya") return !s.category;
                                    return (s.category === cat || (!s.category && cat === "Paket Treatment")) && s.name.toLowerCase().includes(serviceSearch.toLowerCase());
                                  });
                                  if (catServices.length === 0) return null;
                                  return (
                                    <div key={cat} className="mb-1">
                                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 rounded-md mb-1">
                                        {cat}
                                      </div>
                                      {catServices.map(s => {
                                        const isSelected = selectedServices.includes(s.id);
                                        return (
                                          <div 
                                            key={s.id}
                                            onClick={() => {
                                              if (isSelected) {
                                                setSelectedServices(selectedServices.filter(id => id !== s.id));
                                              } else {
                                                if (selectedServices.length >= 3) {
                                                  alert("Maksimal memilih 3 layanan");
                                                  return;
                                                }
                                                setSelectedServices([...selectedServices, s.id]);
                                              }
                                            }}
                                            className={`px-3 py-2.5 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-teal-50 text-teal-700 font-bold' : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'}`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300'}`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                              </div>
                                              <span className="text-sm font-medium">{s.name}</span>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Cabang</label>
                      <div className="relative">
                        <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select 
                          required 
                          disabled={session?.role === "BRANCH_ADMIN"}
                          value={formData.branchId} 
                          onChange={e => setFormData({ ...formData, branchId: e.target.value })} 
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors appearance-none disabled:opacity-70"
                        >
                          <option value="">Pilih Cabang</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Terapis Penanggung Jawab</label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select value={formData.therapistId} onChange={e => setFormData({ ...formData, therapistId: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors appearance-none">
                        <option value="">Tanpa Terapis Khusus</option>
                        {therapists.filter(t => !formData.branchId || !t.branchId || t.branchId === formData.branchId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Tanggal</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="date" required value={formData.visitDate} onChange={e => setFormData({ ...formData, visitDate: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400"/> Catatan Medis Singkat</label>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors" placeholder="Keluhan utama, hasil diagnosa, tindakan..." />
                  </div>
                </div>

              </div>
              
              <div className="mt-8 flex gap-3 justify-end pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">Batalkan</button>
                <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-8 py-2.5 rounded-xl font-semibold shadow-md transition-colors flex items-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5"/>}
                  {saving ? "Memproses..." : "Simpan Kunjungan"}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <>
            {/* Branch Filter Dropdown - Only show if Super Admin */}
            {session?.role === "SUPER_ADMIN" && !loading && branches.length > 0 && (
              <div className="mb-4">
                <div className="relative w-full sm:w-72">
                  <Store className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none shadow-sm text-gray-700 font-medium hover:border-gray-300 cursor-pointer"
                  >
                    <option value="ALL">Semua Cabang</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Tabel Data Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
              
              {/* Header Tabel */}
              <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    Riwayat Kunjungan <span className="bg-gray-100 text-gray-600 text-xs py-1 px-2.5 rounded-full ml-2">{finalVisits.length}</span>
                  </h3>
                </div>
                
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari pasien..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors w-full sm:w-64" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold">Waktu & Tgl</th>
                      <th className="px-6 py-4 font-semibold">Profil Pasien</th>
                      <th className="px-6 py-4 font-semibold">Info Layanan</th>
                      {selectedBranchId === "ALL" && (
                        <th className="px-6 py-4 font-semibold">Cabang</th>
                      )}
                      <th className="px-6 py-4 font-semibold">Status Pembayaran</th>
                      <th className="px-6 py-4 font-semibold w-1/4">Catatan Medis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                          Sedang memuat data...
                        </div>
                      </td></tr>
                    ) : finalVisits.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-16 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <CalendarCheck className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Buku pasien masih kosong</p>
                        <p className="text-sm text-gray-400 mt-1">Belum ada riwayat kunjungan yang sesuai dengan filter.</p>
                      </td></tr>
                    ) : (
                      paginatedVisits.map(v => {
                        const visitNumber = getVisitSequenceNumber(v.patientId, v.id);
                        const isNewPatient = visitNumber === 1;
                        
                        return (
                          <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{v.visitDate.split('-').reverse().join('/')}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {v.visitTime}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{getPatientName(v.patientId)}</div>
                              <div className="mt-1.5">
                                {isNewPatient ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    Pasien Baru
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                    Kunjungan #{visitNumber}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-teal-500"/> {getServiceName(v.serviceId)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                <User className="w-3.5 h-3.5"/> {getTherapistName(v.therapistId)}
                              </div>
                            </td>
                            {selectedBranchId === "ALL" && (
                              <td className="px-6 py-4">
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                                  <Store className="w-3.5 h-3.5"/> {getBranchName(v.branchId)}
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              {v.paymentStatus === "PAID" ? (
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3" /> Lunas
                                  </span>
                                  <button 
                                    onClick={() => handleOpenPOSForVisit(v.id, v.patientId, v.branchId, v.therapistId, "")}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3"/> Tambah Layanan
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleOpenPOSForVisit(v.id, v.patientId, v.branchId, v.therapistId, v.serviceId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                  Ke Kasir
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-600 whitespace-normal line-clamp-2 max-w-sm" title={v.notes || ""}>
                                {v.notes || <span className="text-gray-400 italic">Tidak ada catatan</span>}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {!loading && finalVisits.length > 0 && (
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                  totalItems={finalVisits.length} 
                  itemsPerPage={itemsPerPage} 
                />
              )}
            </div>
          </>
        )}

        {activeTab === "recap" && (
          <div className="space-y-6">
            {/* Sub-tab Selection */}
            <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl shadow-sm w-max mb-6">
              <button
                onClick={() => setRecapSubTab("daily")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${recapSubTab === "daily" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
              >
                <Calendar className="w-4 h-4" />
                Tampilan Harian
              </button>
              <button
                onClick={() => setRecapSubTab("monthly")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${recapSubTab === "monthly" ? "bg-primary text-primary-foreground shadow-md" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
              >
                <TrendingUp className="w-4 h-4" />
                Tampilan Bulanan
              </button>
            </div>

            {recapSubTab === "daily" ? (
              <div className="space-y-6">
                {/* Filter Tanggal */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Rekapitulasi Kunjungan Harian</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Analisis performa harian pasien untuk masing-masing cabang.</p>
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input 
                      type="date" 
                      value={recapDate} 
                      onChange={(e) => setRecapDate(e.target.value)}
                      className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-gray-700 shadow-sm outline-none w-full sm:w-auto"
                    />
                  </div>
                </div>

                {recapLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium text-sm">Memuat data rekap harian...</p>
                  </div>
                ) : !recapData ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
                    Gagal memuat data rekap harian.
                  </div>
                ) : (
                  <>
                    {/* 4 Dashboard Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Pasien</p>
                          <h4 className="text-2xl font-black text-gray-900 mt-1">{recapData.summary.totalVisits} Kunjungan</h4>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Omset (Lunas)</p>
                          <h4 className="text-2xl font-black text-green-600 mt-1">{formatRupiah(recapData.summary.totalRevenue)}</h4>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <Check className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pembayaran</p>
                          <h4 className="text-sm font-bold text-gray-900 mt-1">Lunas: <span className="text-green-600 font-extrabold">{recapData.summary.totalPaid}</span></h4>
                          <p className="text-xs text-gray-500">Belum: <span className="text-red-500 font-extrabold">{recapData.summary.totalUnpaid}</span></p>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Kunjungan Batal</p>
                          <h4 className="text-2xl font-black text-gray-900 mt-1">{recapData.summary.totalCancelled || 0}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Simple Recap Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6 animate-in fade-in duration-300">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Terapis</th>
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Kunjungan</th>
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pendapatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {recapData.therapistStats && recapData.therapistStats.map((stat: any) => (
                              <tr key={stat.therapistId} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-900">{getTherapistName(stat.therapistId)}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-700">{stat.visitCount}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">{formatRupiah(stat.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500">Fitur Tampilan Bulanan sedang dalam pemeliharaan.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: BUAT STRUK ===== */}
        {activeTab === "pos" && (
          <div className="bg-white rounded-2xl shadow-sm">
            {renderPOSFormContent()}
          </div>
        )}
        {/* ===== TAB: RIWAYAT STRUK ===== */}
        {activeTab === "invoices" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-medium cursor-pointer"
                  />
                </div>
                <select
                  value={historyPaymentFilter}
                  onChange={e => setHistoryPaymentFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700 font-medium text-sm transition-all cursor-pointer"
                >
                  <option value="ALL">Semua Pembayaran</option>
                  <option value="CASH">Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="TRANSFER BANK">Transfer Bank</option>
                  <option value="DEBIT">Debit</option>
                </select>
                <span className="text-sm text-gray-500 font-medium">{filteredInvoiceHistory.length} struk</span>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* Summary Cards */}
            {filteredInvoiceHistory.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total Struk</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{filteredInvoiceHistory.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total Pendapatan</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {formatRupiah(filteredInvoiceHistory.reduce((sum, inv) => sum + inv.grandTotal, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Cash</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {formatRupiah(filteredInvoiceHistory.filter(i => i.paymentMethod === "CASH").reduce((sum, inv) => sum + inv.grandTotal, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Non-Cash</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {formatRupiah(filteredInvoiceHistory.filter(i => i.paymentMethod !== "CASH").reduce((sum, inv) => sum + inv.grandTotal, 0))}
                  </p>
                </div>
              </div>
            )}

            {/* Invoice List */}
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredInvoiceHistory.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Receipt className="w-16 h-16 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium">Belum ada struk untuk tanggal ini.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-gray-600">No. Invoice</th>
                        <th className="text-left px-4 py-3 font-bold text-gray-600">Waktu</th>
                        <th className="text-left px-4 py-3 font-bold text-gray-600">Pasien</th>
                        <th className="text-left px-4 py-3 font-bold text-gray-600">Terapis</th>
                        <th className="text-left px-4 py-3 font-bold text-gray-600">Layanan</th>
                        <th className="text-right px-4 py-3 font-bold text-gray-600">Total</th>
                        <th className="text-center px-4 py-3 font-bold text-gray-600">Bayar</th>
                        <th className="text-center px-4 py-3 font-bold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {filteredInvoiceHistory.map(inv => {
                        let parsedItems: any[] = [];
                        try { parsedItems = JSON.parse(inv.items); } catch {}

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(inv.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800">{inv.patientName}</p>
                              <p className="text-xs text-gray-400">{inv.patientPhone}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{inv.therapistName || "-"}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                              {parsedItems.map(i => i.name).join(", ")}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(inv.grandTotal)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                inv.paymentMethod === "CASH" ? "bg-green-50 text-green-700" :
                                inv.paymentMethod === "DEBIT" ? "bg-blue-50 text-blue-700" :
                                "bg-purple-50 text-purple-700"
                              }`}>
                                {inv.paymentMethod}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handlePrint(inv.id)}
                                  title="Cetak Ulang"
                                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSendWA(inv.id)}
                                  title="Kirim WA"
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCopyLink(inv.id)}
                                  title="Salin Link"
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Link2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: RETENTION ===== */}
        {activeTab === "retention" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-orange-500" /> Follow-up & Retensi Pasien
                </h3>
                <p className="text-sm text-gray-500 mt-1">Daftar pasien yang belum berkunjung kembali selama lebih dari 14 hari.</p>
              </div>
              <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                Total: {retentionPatients.length} Pasien
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Pasien</th>
                    <th className="px-6 py-4">Kunjungan Terakhir</th>
                    <th className="px-6 py-4">Lama Absen</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {retentionPatients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-gray-600 font-medium">Bagus Sekali!</p>
                        <p className="text-sm text-gray-400 mt-1">Tidak ada pasien yang absen lebih dari 14 hari.</p>
                      </td>
                    </tr>
                  ) : (
                    retentionPatients.map((rp, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{rp.patient.name}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {rp.patient.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {rp.lastVisitDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            rp.daysSinceLastVisit > 30 ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}>
                            {rp.daysSinceLastVisit} Hari
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              const msg = encodeURIComponent(`Halo Kak ${rp.patient.name},\nApa kabar? Semoga selalu sehat ya.\n\nKami dari Navara Reflexology menyadari sudah ${rp.daysSinceLastVisit} hari sejak kunjungan terakhir Kakak. Yuk jaga kesehatan dengan rutinitas terapi bersama kami lagi. Ada promo khusus menanti Kakak!\n\nSilakan balas pesan ini untuk reservasi.`);
                              window.open(`https://wa.me/${rp.patient.phone.replace(/^0/, '62')}?text=${msg}`, "_blank");
                            }}
                            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" /> Kirim Pengingat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
           {posModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">Kasir POS</h3>
              <button 
                onClick={() => { setPosModalOpen(false); resetPOSForm(); fetchData(); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50/50 custom-scrollbar">
               {renderPOSFormContent()}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
