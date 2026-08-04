"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, CalendarCheck, Search, User, Phone, MapPin, Activity, Store, 
  UserCheck, Calendar, Clock, FileText, X, ChevronDown, Users, TrendingUp, 
  Check, Receipt, Printer, MessageCircle, Link2, Download, AlertCircle, 
  Minus, Trash2, Copy, Edit, CheckCircle2, Bell, Wallet, Save, Timer
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/layout/PageHeader";
import TherapistPicker from "@/components/ui/TherapistPicker";
import ConfirmModal from "@/components/ui/ConfirmModal";


type PatientVisit = {
  id: string;
  patientId: string;
  serviceId: string;
  branchId: string;
  therapistId: string | null;
  visitDate: string;
  visitTime: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualCheckOutTime: string | null;
  notes: string | null;
  status: "in_progress" | "completed" | "cancelled";
  paymentStatus: "UNPAID" | "PAID";
  createdAt: string;
};

type Patient = { id: string; name: string; phone: string };
type Therapist = { id: string; name: string; branchId: string | null };
type Branch = { id: string; name: string; address?: string; phone?: string };
type Service = { id: string; name: string; price?: number; category?: string; durationMinutes?: number };

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
  splitPayments: string | null;
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
  const [todayInvoices, setTodayInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable" | "large">("comfortable");
  
  // Helper for local date string (YYYY-MM-DD)
  const getLocalDateString = useCallback(() => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  }, []);

  // Set default filter date to today on mount
  useEffect(() => {
    setFilterDate(getLocalDateString());
  }, [getLocalDateString]);

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
  const [posVisitIds, setPosVisitIds] = useState<string[]>([]);
  const [posModalOpen, setPosModalOpen] = useState(false);

  const getFormattedTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [matchingPatients, setMatchingPatients] = useState<any[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [posMatchingPatients, setPosMatchingPatients] = useState<any[]>([]);
  const [showPosPatientDropdown, setShowPosPatientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    address: "",
    gender: "L",
    serviceId: "",
    branchId: "",
    therapistId: "",
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: getFormattedTime(),
    checkInTime: getFormattedTime(),
    checkOutTime: "",
    bloodPressure: "",
    notes: "",
    status: "completed",
  });

  // Auto-calculate checkOutTime berdasarkan checkInTime + total durasi layanan
  useEffect(() => {
    if (!formData.checkInTime || selectedServices.length === 0) {
      return;
    }
    const totalMinutes = selectedServices.reduce((sum, id) => {
      const svc = services.find(s => s.id === id);
      return sum + (svc?.durationMinutes || 0);
    }, 0);
    if (totalMinutes <= 0) return;

    // Menangani format separator waktu (bisa : atau .)
    const normalizedTime = formData.checkInTime.replace(".", ":");
    const [h, m] = normalizedTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const totalMins = h * 60 + m + totalMinutes;
    const outH = Math.floor(totalMins / 60) % 24;
    const outM = totalMins % 60;
    const autoOut = `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
    setFormData(prev => ({ ...prev, checkOutTime: autoOut }));
  }, [formData.checkInTime, selectedServices, services]);

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

  // Patient History Modal State
  const [selectedPatientHistoryId, setSelectedPatientHistoryId] = useState<string | null>(null);

  // Pagination Reset Effect
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, filterDate]);

  // POS (Kasir) Tab States
  const [posPhone, setPosPhone] = useState("");
  const [posPatientName, setPosPatientName] = useState("");
  const [posBranchId, setPosBranchId] = useState("");
  const [posTherapistId, setPosTherapistId] = useState("");
  const [posVisitDate, setPosVisitDate] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
  const [posItems, setPosItems] = useState<InvoiceItem[]>([]);
  const [posDiscount, setPosDiscount] = useState(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState("CASH");
  const [posIsSplitPayment, setPosIsSplitPayment] = useState(false);
  const [posSplitMethod1, setPosSplitMethod1] = useState("CASH");
  const [posSplitMethod2, setPosSplitMethod2] = useState("QRIS");
  const [posSplitAmount1, setPosSplitAmount1] = useState(0);
  const [posSplitAmount2, setPosSplitAmount2] = useState(0);
  const [posAmountPaid, setPosAmountPaid] = useState(0);
  const [posNotes, setPosNotes] = useState("");
  const [posProcessing, setPosProcessing] = useState(false);
  const [posCreatedInvoice, setPosCreatedInvoice] = useState<{ id: string; invoiceNumber: string; grandTotal: number; changeAmount: number } | null>(null);

  // Invoice History States
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [historyDate, setHistoryDate] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState("ALL");

  // Timer state for active therapies
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [visitToFinish, setVisitToFinish] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinishVisit = (visitId: string) => {
    setVisitToFinish(visitId);
    setFinishModalOpen(true);
  };

  const confirmFinishVisit = async () => {
    if (!visitToFinish) return;
    setIsFinishing(true);
    
    try {
      const res = await fetch(`/api/patient-visits/${visitToFinish}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      });
      if (res.ok) {
        setFinishModalOpen(false);
        setVisitToFinish(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyelesaikan kunjungan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsFinishing(false);
    }
  };

  const renderTherapyStatus = (v: PatientVisit) => {
    if (v.status === "completed") {
      return (
        <div className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
          <CheckCircle2 className="w-3 h-3" /> Selesai
        </div>
      );
    }
    if (v.status === "cancelled") {
      return (
        <div className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-600 border border-red-200">
          <X className="w-3 h-3" /> Batal
        </div>
      );
    }
    if (v.status === "in_progress" && v.checkOutTime) {
      const parts = v.visitDate.split('-');
      const [h, m] = v.checkOutTime.split(":").map(Number);
      const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), h, m, 0);
      
      // Zero out seconds from currentTime to align countdown perfectly with wall-clock minutes
      const currentMins = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), currentTime.getMinutes(), 0);
      const diffMs = target.getTime() - currentMins.getTime();
      const mins = Math.round(diffMs / 60000);
      
      if (mins > 0) {
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); handleFinishVisit(v.id); }}
            title="Klik untuk menyelesaikan layanan sekarang"
            className="inline-flex w-max items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm animate-in fade-in hover:bg-amber-200 transition-colors"
          >
            <Timer className="w-2.5 h-2.5 animate-pulse" /> Sisa {mins} mnt
          </button>
        );
      } else {
        if (v.paymentStatus === "PAID") {
          return (
            <div className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
              <CheckCircle2 className="w-3 h-3" /> Selesai
            </div>
          );
        }
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); handleFinishVisit(v.id); }}
            title="Klik untuk menyelesaikan layanan sekarang"
            className="inline-flex w-max items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 shadow-sm animate-in fade-in hover:bg-red-200 transition-colors"
          >
            <AlertCircle className="w-2.5 h-2.5 animate-pulse" /> Habis ({Math.abs(mins)}m)
          </button>
        );
      }
    }
    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const matches = patients.filter(p => p.phone === val);
    if (matches.length === 1) {
      const existing = matches[0];
      setFormData(prev => ({
        ...prev,
        phone: val,
        name: existing.name,
        gender: existing.gender || "L",
        address: existing.address || "",
      }));
      setShowPatientDropdown(false);
    } else if (matches.length > 1) {
      setFormData(prev => ({ ...prev, phone: val, name: "", address: "", gender: "L" }));
      setMatchingPatients(matches);
      setShowPatientDropdown(true);
    } else {
      setFormData(prev => ({ ...prev, phone: val }));
      setShowPatientDropdown(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      name: patient.name,
      gender: patient.gender || "L",
      address: patient.address || "",
    }));
    setShowPatientDropdown(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
      const [resVisits, resPatients, resTherapists, resBranches, resServices, resSession, resInvoices] = await Promise.all([
        fetch("/api/patient-visits"),
        fetch("/api/patients"),
        fetch("/api/therapists"),
        fetch("/api/branches"),
        fetch("/api/services"),
        fetch("/api/auth/session"),
        fetch(`/api/invoices?date=${today}`)
      ]);
      if (resVisits.ok) setVisits((await resVisits.json()).data || []);
      if (resPatients.ok) setPatients((await resPatients.json()).data || []);
      if (resTherapists.ok) setTherapists(await resTherapists.json() || []);
      if (resBranches.ok) setBranches((await resBranches.json()).data || []);
      if (resServices.ok) setServices((await resServices.json()).data || []);
      if (resInvoices.ok) setTodayInvoices((await resInvoices.json()).data || []);
      if (resSession.ok) {
        const sessionData = await resSession.json();
        setSession(sessionData.session);
        if (sessionData.session.role === "BRANCH_ADMIN" || sessionData.session.role === "CASHIER") {
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
    const matches = patients.filter(p => p.phone === val);
    if (matches.length === 1) {
      setPosPatientName(matches[0].name);
      setShowPosPatientDropdown(false);
    } else if (matches.length > 1) {
      setPosPatientName("");
      setPosMatchingPatients(matches);
      setShowPosPatientDropdown(true);
    } else {
      setShowPosPatientDropdown(false);
    }
  };

  const handleSelectPosPatient = (patient: any) => {
    setPosPatientName(patient.name);
    setShowPosPatientDropdown(false);
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
  const totalPosPaid = posIsSplitPayment ? (posSplitAmount1 + posSplitAmount2) : posAmountPaid;
  const posChangeAmount = Math.max(0, totalPosPaid - posGrandTotal);

  const handlePOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posItems.length === 0) return alert("Tambahkan minimal 1 item layanan!");
    if (!posPhone || !posPatientName || !posBranchId) return alert("Lengkapi data pasien & cabang!");
    
    const totalPaid = posIsSplitPayment ? (posSplitAmount1 + posSplitAmount2) : posAmountPaid;
    if (totalPaid < posGrandTotal) return alert("Uang diterima kurang dari total!");

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
          paymentMethod: posIsSplitPayment ? "SPLIT" : posPaymentMethod,
          splitPayments: posIsSplitPayment ? [
            { method: posSplitMethod1, amount: posSplitAmount1 },
            { method: posSplitMethod2, amount: posSplitAmount2 }
          ] : null,
          amountPaid: totalPaid,
          notes: posNotes || null,
          visitId: posVisitId,
          visitIds: posVisitIds,
          transactionDate: posVisitDate,
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
    setPosIsSplitPayment(false);
    setPosSplitMethod1("CASH");
    setPosSplitMethod2("QRIS");
    setPosSplitAmount1(0);
    setPosSplitAmount2(0);
    setPosAmountPaid(0);
    setPosNotes("");
    setPosCreatedInvoice(null);
    setPosVisitDate(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
    setPosVisitId(null);
    setPosVisitIds([]);
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

  const handleOpenNewVisit = () => {
    setFormData(prev => ({
      ...prev,
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: getFormattedTime(),
      checkInTime: getFormattedTime(),
    }));
    setIsFormOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) return alert("Pilih minimal 1 layanan!");
    
    // Validasi jam
    if (formData.checkInTime && formData.checkOutTime) {
      if (formData.checkOutTime <= formData.checkInTime) {
        return alert("Jam keluar harus lebih besar dari jam masuk!");
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/patient-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          serviceIds: selectedServices,
          notes: formData.notes,
          checkInTime: formData.checkInTime || null,
          checkOutTime: formData.checkOutTime || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409) {
          alert(errData.error || "Konflik data!");
          setSaving(false);
          return;
        }
      }

      setIsFormOpen(false);
      setFormData(prev => ({
        ...prev,
        phone: "", name: "", address: "", bloodPressure: "", notes: "",
        checkInTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        checkOutTime: "",
        therapistId: "",
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
    
    // Set date based on visit if available, else today
    const visit = visits.find(v => v.id === visitId);
    const visitDateToUse = visit?.visitDate || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    setPosVisitDate(visitDateToUse);

    // Bundle ALL unpaid visits for this patient today
    const unpaidVisits = visits.filter(v => 
      v.patientId === patientId && 
      v.visitDate === visitDateToUse && 
      v.paymentStatus === "UNPAID"
    );

    const relevantVisits = unpaidVisits.length > 0 ? unpaidVisits : (visit ? [visit] : []);
    const ids = relevantVisits.map(v => v.id);
    
    setPosVisitIds(ids);
    setPosVisitId(ids[0] || null);

    const newItems: InvoiceItem[] = [];
    for (const v of relevantVisits) {
      const svc = services.find(s => s.id === v.serviceId);
      if (svc) {
        const existing = newItems.find(i => i.serviceId === svc.id);
        if (existing) {
          existing.qty += 1;
          existing.subtotal = existing.qty * (svc.price || 0);
        } else {
          newItems.push({
            serviceId: svc.id,
            name: svc.name,
            qty: 1,
            price: svc.price || 0,
            subtotal: svc.price || 0,
          });
        }
      }
    }
    setPosItems(newItems);
    
    setPosModalOpen(true);
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;
  const getTherapistName = (id: string | null) => {
    if (!id) return "-";
    return therapists.find(t => t.id === id)?.name || id;
  };
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || id;
  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || id;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteVisit = (visitId: string) => {
    setVisitToDelete(visitId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteVisit = async () => {
    if (!visitToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/patient-visits/${visitToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        setVisitToDelete(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus data kunjungan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  const getVisitSequenceNumber = (patientId: string, visitId: string) => {
    const patientVisits = visits.filter(v => v.patientId === patientId);
    const groups: { [key: string]: typeof patientVisits } = {};
    for (const v of patientVisits) {
      const key = `${v.visitDate}_${v.visitTime}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const dateA = new Date(`${a[0].visitDate}T${(a[0].visitTime || '00:00').replace('.', ':')}:00`).getTime();
      const dateB = new Date(`${b[0].visitDate}T${(b[0].visitTime || '00:00').replace('.', ':')}:00`).getTime();
      return dateB - dateA;
    });
    const groupIndex = sortedGroups.findIndex(g => g.some(v => v.id === visitId));
    return groupIndex >= 0 ? sortedGroups.length - groupIndex : 1;
  };

  let finalVisits = visits.filter(v => {
    const matchDate = filterDate === "" || v.visitDate === filterDate;
    const patientName = getPatientName(v.patientId).toLowerCase();
    const matchSearch = patientName.includes(searchQuery.toLowerCase());
    return matchDate && matchSearch;
  }).sort((a, b) => {
    const dateA = new Date(`${a.visitDate}T${(a.visitTime || '00:00').replace('.', ':')}:00`).getTime();
    const dateB = new Date(`${b.visitDate}T${(b.visitTime || '00:00').replace('.', ':')}:00`).getTime();
    return dateB - dateA;
  });

  // Hitung KPI menggunakan data asli (bukan paginated)
  const todayDateString = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  
  const branchVisits = visits;
  
  const kpiVisitsToday = Array.from(new Set(
    branchVisits.filter(v => v.visitDate === todayDateString).map(v => `${v.patientId}_${v.visitTime}`)
  )).length;
  
  const kpiRevenueToday = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
  const kpiNewPatientsToday = Array.from(new Set(
    branchVisits
      .filter(v => v.visitDate === todayDateString && getVisitSequenceNumber(v.patientId, v.id) === 1)
      .map(v => v.patientId)
  )).length;
  
  const kpiRetention = kpiVisitsToday > 0 
    ? Math.round(((kpiVisitsToday - kpiNewPatientsToday) / kpiVisitsToday) * 100)
    : 0;

  const kpiRevenueFormatted = kpiRevenueToday >= 1000000 
    ? `Rp ${(kpiRevenueToday / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Juta`
    : formatRupiah(kpiRevenueToday);

  const groupedFinalVisits = (() => {
    const groups: { [key: string]: typeof finalVisits } = {};
    for (const v of finalVisits) {
      const key = `${v.patientId}_${v.visitDate}_${v.visitTime}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    return Object.values(groups);
  })();

  const totalPages = Math.ceil(groupedFinalVisits.length / itemsPerPage);
  const paginatedGroups = groupedFinalVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                            disabled={!!posVisitId}
                            value={posPhone}
                            onChange={e => handlePOSPhoneChange(e.target.value)}
                            placeholder="08123..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          />
                          {showPosPatientDropdown && posMatchingPatients.length > 1 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              <div className="px-3 py-2 bg-amber-50 text-amber-700 text-xs font-bold border-b border-amber-100 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Pilih Pasien:
                              </div>
                              {posMatchingPatients.map(patient => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => handleSelectPosPatient(patient)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors flex flex-col"
                                >
                                  <span className="font-bold text-gray-800 text-sm">{patient.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {patients.find(p => p.phone === posPhone) && !showPosPatientDropdown && (
                          <p className="text-xs text-blue-600 flex items-center gap-1"><Check className="w-3 h-3" /> Pasien terdaftar</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Tanggal Transaksi</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            required
                            disabled={!!posVisitId}
                            value={posVisitDate}
                            onChange={e => setPosVisitDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Nama Pasien</label>
                        <input
                          type="text"
                          required
                          disabled={!!posVisitId}
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
                            disabled={!!posVisitId || session?.role === "BRANCH_ADMIN" || session?.role === "CASHIER"}
                            value={posBranchId}
                            onChange={e => setPosBranchId(e.target.value)}
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
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" /> Pilih Layanan
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="relative mb-4">
                      <select
                        onChange={e => { addPOSItem(e.target.value); e.target.value = ""; }}
                        value=""
                        className="w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none cursor-pointer hover:bg-blue-100"
                      >
                        <option value="">+ Tambah Layanan / Treatment</option>
                        {["Paket Treatment", "Mcu", "Refleksi", "Bekam", "Adds On"].map(cat => {
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
                                className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                              <button type="button" onClick={() => updatePOSItemQty(item.serviceId, item.qty + 1)}
                                className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="font-bold text-gray-900 text-sm w-24 text-right">{formatRupiah(item.subtotal)}</p>
                            <button type="button" onClick={() => removePOSItem(item.serviceId)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg">
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
                        <span className="text-2xl font-extrabold text-blue-600">{formatRupiah(posGrandTotal)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700">Metode Pembayaran</label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={posIsSplitPayment}
                            onChange={(e) => setPosIsSplitPayment(e.target.checked)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                          />
                          <span className="font-medium text-gray-600">Split Payment (Ganda)</span>
                        </label>
                      </div>

                      {!posIsSplitPayment ? (
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
                                  ? "bg-blue-50 border-blue-400 text-blue-700"
                                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          {/* Split 1 */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Metode 1</label>
                              <select 
                                value={posSplitMethod1}
                                onChange={e => setPosSplitMethod1(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              >
                                <option value="CASH">Cash</option>
                                <option value="QRIS">QRIS</option>
                                <option value="TRANSFER BANK">Transfer Bank</option>
                                <option value="DEBIT">Debit</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Nominal 1</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={posSplitAmount1.toString()}
                                onChange={e => {
                                  const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                  setPosSplitAmount1(val);
                                  setPosSplitAmount2(Math.max(0, posGrandTotal - val));
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          {/* Split 2 */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Metode 2</label>
                              <select 
                                value={posSplitMethod2}
                                onChange={e => setPosSplitMethod2(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              >
                                <option value="QRIS">QRIS</option>
                                <option value="CASH">Cash</option>
                                <option value="TRANSFER BANK">Transfer Bank</option>
                                <option value="DEBIT">Debit</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Nominal 2</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={posSplitAmount2.toString()}
                                onChange={e => setPosSplitAmount2(e.target.value === "" ? 0 : parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Amount Paid */}
                    {!posIsSplitPayment && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Uang Diterima (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={posAmountPaid.toString()}
                          onChange={e => setPosAmountPaid(e.target.value === "" ? 0 : parseInt(e.target.value))}
                          placeholder="Masukkan nominal..."
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                        {/* Quick amount buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {[posGrandTotal, 50000, 100000, 150000, 200000].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amount => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setPosAmountPaid(amount)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                              {formatRupiah(amount)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change */}
                    {totalPosPaid >= posGrandTotal && totalPosPaid > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-blue-700">Kembalian</span>
                          <span className="text-xl font-extrabold text-blue-700">{formatRupiah(posChangeAmount)}</span>
                        </div>
                      </div>
                    )}

                    {totalPosPaid > 0 && totalPosPaid < posGrandTotal && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" /> Uang diterima kurang {formatRupiah(posGrandTotal - totalPosPaid)}
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
                      disabled={posProcessing || posItems.length === 0 || totalPosPaid < posGrandTotal}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
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
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-8 py-10 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold">Pembayaran Berhasil!</h3>
                <p className="text-blue-100 mt-2 font-medium">{posCreatedInvoice.invoiceNumber}</p>
                <p className="text-3xl font-extrabold mt-3">{formatRupiah(posCreatedInvoice.grandTotal)}</p>
                {posCreatedInvoice.changeAmount > 0 && (
                  <p className="text-blue-100 mt-1">Kembalian: {formatRupiah(posCreatedInvoice.changeAmount)}</p>
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
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
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
        
        {/* Mobile-only Seabank-style UI */}
        <div className="md:hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 pt-6 pb-20 relative -mx-4 -mt-8 sm:-mx-6 sm:-mt-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl font-bold tracking-tight">Kunjungan</h1>
              <div className="relative p-2 bg-blue-500/50 rounded-full border border-blue-400">
                <Bell className="w-5 h-5 text-white" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-blue-500"></div>
              </div>
            </div>
          </div>
          
          {/* Overlapping Grid Card */}
          <div className="px-1 -mt-14 relative z-10 mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
              <div className="grid grid-cols-4 gap-y-5 gap-x-2">
                {[
                  { name: "Tambah", icon: Plus, action: handleOpenNewVisit, color: "text-blue-500", badge: "" },
                  { name: "Hari Ini", icon: CalendarCheck, action: () => { setFilterDate(getLocalDateString()); handleTabChange("list"); }, color: "text-blue-500", badge: "New" },
                  { name: "Selesai", icon: CheckCircle2, action: () => handleTabChange("list"), color: "text-blue-500", badge: "" },
                  { name: "Batal", icon: Trash2, action: () => handleTabChange("list"), color: "text-red-500", badge: "" },
                  { name: "Laporan", icon: FileText, action: () => handleTabChange("recap"), color: "text-orange-500", badge: "" },
                  { name: "Pasien", icon: Users, action: () => handleTabChange("retention"), color: "text-purple-500", badge: "" },
                  { name: "Struk", icon: Receipt, action: () => handleTabChange("invoices"), color: "text-blue-500", badge: "" },
                  { name: "POS", icon: Store, action: () => handleTabChange("pos"), color: "text-rose-500", badge: "" },
                ].map((item, idx) => (
                  <button key={idx} onClick={item.action} className="flex flex-col items-center justify-start gap-1.5 relative group">
                    <div className="w-[42px] h-[42px] rounded-[14px] bg-gray-50 border border-gray-100 flex items-center justify-center transition-transform active:scale-95">
                      <item.icon className={`w-[20px] h-[20px] ${item.color} fill-${item.color.split('-')[1]}-100`} strokeWidth={2} />
                    </div>
                    {item.badge && (
                      <span className="absolute -top-1.5 right-0 md:right-4 bg-orange-100 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-orange-200 uppercase tracking-widest z-10">
                        {item.badge}
                      </span>
                    )}
                    <span className="font-semibold text-[10px] text-gray-700 text-center w-full leading-tight">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex bg-white px-2 border-b border-gray-100 rounded-t-2xl">
            <button 
              onClick={() => { setActiveTab("list"); setFilterDate(getLocalDateString()); }}
              className={`flex-1 py-3 text-[13px] font-bold text-center border-b-[3px] transition-colors ${filterDate === getLocalDateString() && activeTab === "list" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => { setActiveTab("list"); setFilterDate(""); }}
              className={`flex-1 py-3 text-[13px] font-bold text-center border-b-[3px] transition-colors ${filterDate === "" && activeTab === "list" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}
            >
              Semua Data
            </button>
          </div>

          {/* Mobile Search */}
          <div className="p-4 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.03)] relative z-10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari pasien di sini"
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-transparent rounded-full text-[13px] font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Desktop Header Section */}
        <div className="hidden md:block">
          <PageHeader 
            title="Kunjungan"
            description="Catat dan pantau seluruh riwayat kunjungan pasien."
            icon={CalendarCheck}
            rightContent={
              <button onClick={handleOpenNewVisit} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <Plus className="h-5 w-5" /> Catat Kunjungan
              </button>
            }
          />
        </div>

        {/* Desktop Tab Selection */}
        <div className="hidden md:flex border-b border-gray-200 mb-8 bg-white p-1 rounded-xl shadow-sm w-max">
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
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-blue-500 z-10"></div>
              
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
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
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4"/> Data Pasien
                    </h4>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                      {formData.name && formData.phone ? "✓ Data Terisi" : "1/4 Terisi"}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      Nomor Telepon/WA <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative group">
                      <Search className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${formData.phone ? 'text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                      <input type="text" required value={formData.phone} onChange={handlePhoneChange} placeholder="Cari Pasien (Ketik 08...)" className={`w-full pl-10 pr-10 py-3 bg-white border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 transition-all font-semibold ${patients.find(p => p.phone === formData.phone) ? 'border-blue-400 focus:border-blue-500 text-blue-900' : 'border-gray-300 focus:border-blue-500 text-gray-900'}`} />
                      {patients.find(p => p.phone === formData.phone) && !showPatientDropdown && (
                        <CheckCircle2 className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" />
                      )}
                      
                      {/* Dropdown untuk memilih pasien jika ada nomor WA ganda */}
                      {showPatientDropdown && matchingPatients.length > 1 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          <div className="px-3 py-2 bg-amber-50 text-amber-700 text-xs font-bold border-b border-amber-100 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Ditemukan {matchingPatients.length} pasien. Pilih salah satu:
                          </div>
                          {matchingPatients.map(patient => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handleSelectPatient(patient)}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors flex flex-col"
                            >
                              <span className="font-bold text-gray-800">{patient.name}</span>
                              <span className="text-[10px] text-gray-500">{patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} {patient.address ? `- ${patient.address}` : ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {patients.find(p => p.phone === formData.phone) && !showPatientDropdown ? (
                      <p className="text-[11px] font-bold text-blue-700 mt-1 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md w-max border border-blue-100 animate-in fade-in zoom-in duration-300"><UserCheck className="w-3.5 h-3.5"/> ✓ Pasien lama ditemukan (Otomatis terisi)</p>
                    ) : formData.phone.length > 8 && !showPatientDropdown ? (
                      <p className="text-[11px] font-bold text-blue-700 mt-1 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md w-max border border-blue-100 animate-in fade-in zoom-in duration-300"><Plus className="w-3.5 h-3.5"/> + Pasien baru</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">Nama Lengkap <span className="text-red-500 font-bold">*</span></label>
                    <div className="relative">
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400" placeholder="Ketik nama lengkap..." />
                      {formData.name && <Check className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">Jenis Kelamin <span className="text-red-500 font-bold">*</span></label>
                    <div className="flex gap-3">
                      <label className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.gender === 'L' ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-500/20 scale-[1.02]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>
                        <input type="radio" name="gender" value="L" checked={formData.gender === 'L'} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                        Laki-laki
                      </label>
                      <label className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.gender === 'P' ? 'bg-pink-600 border-pink-600 text-white font-bold shadow-md shadow-pink-500/20 scale-[1.02]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>
                        <input type="radio" name="gender" value="P" checked={formData.gender === 'P'} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">Alamat <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">Opsional</span></label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-300" />
                      <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm" placeholder="Detail alamat..."></textarea>
                    </div>
                  </div>
                </div>

                {/* Divider Line Mobile */}
                <div className="lg:hidden border-b border-gray-100"></div>
                <div className="hidden lg:block lg:col-span-1 border-r border-gray-100 mx-auto h-full"></div>

                {/* Kolom Kanan: Rincian Layanan */}
                <div className="lg:col-span-6 space-y-5">
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                              <span className={selectedServices.length === 0 ? "text-gray-500 text-sm" : "text-gray-700 text-sm font-medium pr-4"}>
                                {selectedServices.length === 0 
                                  ? "Pilih Layanan" 
                                  : selectedServices.map(id => services.find(s => s.id === id)?.name).join(", ")}
                              </span>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>

                          {isServiceDropdownOpen && (
                            <div className="absolute z-50 w-[150%] md:w-[200%] max-w-[300px] mt-2 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                              <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-20">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <input 
                                    type="text"
                                    placeholder="Cari layanan..."
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              
                              <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                                {["Paket Treatment", "Mcu", "Refleksi", "Bekam", "Adds On", "Lainnya"].map(cat => {
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
                                                setSelectedServices([...selectedServices, s.id]);
                                              }
                                            }}
                                            className={`px-3 py-2.5 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
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
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">Cabang <span className="text-red-500 font-bold">*</span></label>
                      <div className="relative">
                        <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select 
                          required 
                          disabled={session?.role === "BRANCH_ADMIN" || session?.role === "CASHIER"}
                          value={formData.branchId} 
                          onChange={e => setFormData({ ...formData, branchId: e.target.value })} 
                          className="w-full pl-9 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none disabled:opacity-70 font-medium"
                        >
                          <option value="">Pilih Cabang</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        {formData.branchId && <Check className="w-4 h-4 absolute right-8 top-1/2 -translate-y-1/2 text-blue-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Terapis Penanggung Jawab — Premium Card Picker */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Terapis Penanggung Jawab
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 font-medium">Opsional</span>
                    </label>
                    <TherapistPicker
                      branchId={formData.branchId}
                      selectedTherapistId={formData.therapistId}
                      onSelect={(id) => setFormData({ ...formData, therapistId: id })}
                      pollInterval={5000}
                    />
                  </div>

                  {/* Tanggal + Jam Masuk + Jam Keluar */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">Tanggal <span className="text-red-500 font-bold">*</span></label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="date" required value={formData.visitDate} onChange={e => setFormData({ ...formData, visitDate: e.target.value })} className="w-full pl-9 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Jam Masuk <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="time" 
                          required
                          value={formData.checkInTime} 
                          onChange={e => setFormData({ ...formData, checkInTime: e.target.value })} 
                          className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <Timer className="w-4 h-4 text-amber-600" />
                        Jam Keluar
                      </label>
                      <div className="relative">
                        <input 
                          type="time" 
                          value={formData.checkOutTime} 
                          onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })} 
                          className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-amber-900" 
                        />
                      </div>
                      {formData.checkOutTime && formData.checkInTime && (
                        <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          ⏱ Durasi: {(() => {
                            const [h1, m1] = formData.checkInTime.split(":").map(Number);
                            const [h2, m2] = formData.checkOutTime.split(":").map(Number);
                            const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                            if (diff <= 0) return "Tidak valid";
                            const hours = Math.floor(diff / 60);
                            const mins = diff % 60;
                            return hours > 0 ? `${hours} jam ${mins} menit` : `${mins} menit`;
                          })()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">Tensi Darah <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 font-medium">Opsional</span></label>
                      <div className="relative">
                        <Activity className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" value={formData.bloodPressure} onChange={e => setFormData({ ...formData, bloodPressure: e.target.value })} placeholder="Misal: 120/80" className="w-full pl-9 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium" />
                        {!formData.bloodPressure && <span title="Tensi belum diisi" className="absolute right-3 top-1/2 -translate-y-1/2"><AlertCircle className="w-4 h-4 text-amber-400" /></span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400"/> Catatan Medis Singkat <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">Opsional</span></label>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm" placeholder="Keluhan utama, hasil diagnosa, tindakan..." />
                  </div>
                  
                  {/* Summary Ringkasan */}
                  {selectedServices.length > 0 && (
                    <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 animate-in fade-in zoom-in duration-300">
                      <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Ringkasan Layanan</h5>
                      <div className="space-y-2">
                        {selectedServices.map(id => {
                          const s = services.find(srv => srv.id === id);
                          return (
                            <div key={id} className="flex justify-between text-sm">
                              <span className="text-gray-600">{s?.name} <span className="text-gray-400 text-xs">({s?.durationMinutes}m)</span></span>
                              <span className="font-semibold text-gray-800">{formatRupiah(s?.price || 0)}</span>
                            </div>
                          );
                        })}
                        <div className="border-t border-blue-200/50 pt-2 mt-2 flex justify-between font-bold">
                          <span className="text-blue-900">Estimasi Total</span>
                          <span className="text-blue-700">
                            {formatRupiah(selectedServices.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
              
              <div className="sticky bottom-0 bg-white z-20 pb-6 pt-4 border-t border-gray-100 mt-8 flex gap-3 justify-end shadow-[0_-10px_20px_rgba(255,255,255,1)]">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 bg-white shadow-sm">Batalkan</button>
                <button type="submit" disabled={saving || !formData.phone || !formData.name || selectedServices.length === 0 || !formData.branchId || !formData.visitDate} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-semibold shadow-[0_4px_12px_rgba(13,148,136,0.3)] transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:shadow-none">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5"/>}
                  {saving ? "Memproses..." : "Simpan Kunjungan"}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <>

            {/* Insight Panel KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Kunjungan Hari Ini", value: kpiVisitsToday.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Pendapatan Hari Ini", value: kpiRevenueFormatted, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Pasien Baru", value: kpiNewPatientsToday.toString(), icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Retensi", value: `${kpiRetention}%`, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">{kpi.label}</p>
                    <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabel Data Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
              
              {/* Header Tabel */}
              <div className="hidden md:flex px-6 py-5 border-b border-gray-100 bg-white flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    Riwayat Kunjungan <span className="bg-gray-100 text-gray-600 text-xs py-1 px-2.5 rounded-full ml-2">{finalVisits.length}</span>
                  </h3>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      value={filterDate} 
                      onChange={(e) => setFilterDate(e.target.value)} 
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors w-full sm:w-auto text-gray-600" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden lg:flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setTableDensity("compact")} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${tableDensity === "compact" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Compact</button>
                      <button onClick={() => setTableDensity("comfortable")} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${tableDensity === "comfortable" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Comfort</button>
                      <button onClick={() => setTableDensity("large")} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${tableDensity === "large" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Large</button>
                    </div>
                    <div className="relative group">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari pasien..." className="pl-9 pr-14 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-full sm:w-64" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-60 group-focus-within:opacity-0 transition-opacity">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-sans bg-white border border-gray-200 rounded shadow-sm text-gray-500 font-semibold">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-sans bg-white border border-gray-200 rounded shadow-sm text-gray-500 font-semibold">K</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
              {/* Mobile List View (Seabank Style) */}
              <div className="md:hidden bg-white min-h-[50vh]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-sm font-medium">Memuat data...</span>
                  </div>
                ) : finalVisits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                      <CalendarCheck className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold text-sm">Belum ada kunjungan</p>
                    <p className="text-xs text-gray-400 mt-1">Gunakan tab atau pencarian lain.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paginatedGroups.map(group => {
                      const v = group[0];
                      const patientName = getPatientName(v.patientId);
                      const initial = patientName.charAt(0).toUpperCase();
                      const isPaid = group.every(g => g.paymentStatus === "PAID");
                      
                      return (
                        <div key={v.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer" onClick={() => setSelectedPatientHistoryId(v.patientId)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-[42px] h-[42px] rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-blue-600 shrink-0">
                                {initial}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[14px] text-gray-900 leading-tight mb-0.5">{patientName}</span>
                                <span className="text-[11px] text-gray-500 font-medium mb-1">
                                  {v.visitDate.split('-').reverse().join('/')} &bull; {v.visitTime}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {isPaid ? (
                                <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 text-yellow-500">
                                  <CheckCircle2 className="w-5 h-5 fill-yellow-50" />
                                </button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); handleOpenPOSForVisit(v.id, v.patientId, v.branchId, v.therapistId, ""); }} className="p-1.5 text-orange-500 hover:scale-110 transition-transform">
                                  <Wallet className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 pl-[54px]">
                            <div className="bg-white border border-gray-100 p-2.5 rounded-lg flex items-center justify-between shadow-sm">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                                  <Activity className="w-3 h-3 text-blue-500"/> {getServiceName(v.serviceId)}
                                  {group.length > 1 && (
                                    <span 
                                      className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] ml-1 cursor-help"
                                      title={`Layanan lainnya:\n${group.slice(1).map(g => `• ${getServiceName(g.serviceId)}`).join('\n')}`}
                                    >
                                      +{group.length - 1} lainnya
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1.5"><User className="w-3 h-3"/> {getTherapistName(v.therapistId)}</span>
                              </div>
                              <div>{renderTherapyStatus(v)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Mobile Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={groupedFinalVisits.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                      <th className="px-6 py-4">Waktu & Tgl</th>
                      <th className="px-6 py-4 font-semibold">Profil Pasien</th>
                      <th className="px-6 py-4 font-semibold">Info Layanan</th>

                      <th className="px-6 py-4">Status Pembayaran</th>
                      <th className="px-6 py-4 w-1/4">Catatan Medis</th>
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
                      <tr><td colSpan={6} className="px-6 py-20 text-center">
                        <div className="bg-[#F8FAFC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-sm">
                          <Calendar className="h-10 w-10 text-blue-500/70" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Belum ada kunjungan hari ini</h3>
                        <p className="text-sm text-gray-500 mb-6">Klik "Catat Kunjungan" untuk mulai mencatat pasien.</p>
                        <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 mx-auto">
                          <Plus className="w-4 h-4" /> Catat Kunjungan
                        </button>
                      </td></tr>
                    ) : (
                      paginatedGroups.map(group => {
                        const v = group[0];
                        const visitNumber = getVisitSequenceNumber(v.patientId, v.id);
                        const isNewPatient = visitNumber === 1;
                        
                        const tdClass = `px-6 ${tableDensity === "compact" ? "py-2" : tableDensity === "large" ? "py-6" : "py-4"}`;
                        
                        return (
                          <tr key={v.id} className="hover:bg-[#F8FAFC] hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-200 group relative">
                            <td className={tdClass}>
                              <div className="font-semibold text-gray-900">{v.visitDate.split('-').reverse().join('/')}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {v.visitTime}</div>
                            </td>
                            <td className={tdClass}>
                              <div className="font-bold text-gray-900 flex items-center gap-2">
                                {getPatientName(v.patientId)}
                                <button
                                  onClick={() => setSelectedPatientHistoryId(v.patientId)}
                                  className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 transition-colors flex items-center gap-1 font-bold shadow-sm"
                                  title="Lihat Riwayat Kunjungan Pasien"
                                >
                                  <Calendar className="w-3 h-3" /> Riwayat
                                </button>
                              </div>
                              <div className="mt-1.5">
                                {isNewPatient ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-blue-700 border border-blue-200">
                                    Pasien Baru
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                    Kunjungan #{visitNumber}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={tdClass}>
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-blue-500"/> {getServiceName(v.serviceId)}
                                    {group.length > 1 && (
                                      <span 
                                        className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] ml-1 cursor-help"
                                        title={`Layanan lainnya:\n${group.slice(1).map(g => `• ${getServiceName(g.serviceId)}`).join('\n')}`}
                                      >
                                        +{group.length - 1} lainnya
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-gray-500 flex items-center gap-1 border-l border-gray-200 pl-2">
                                    <User className="w-3 h-3"/> {getTherapistName(v.therapistId)}
                                  </span>
                                  <div className="pl-1">
                                    {renderTherapyStatus(v)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className={tdClass}>
                              {group.every(g => g.paymentStatus === "PAID") ? (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200 w-full justify-center group-hover:shadow-sm transition-shadow">
                                    <Check className="w-3 h-3" /> Lunas
                                  </span>
                                  <div className="flex items-center gap-1 w-full">
                                    <button 
                                      onClick={() => handleOpenPOSForVisit(v.id, v.patientId, v.branchId, v.therapistId, "")}
                                      className="text-[10px] flex-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Plus className="w-3 h-3"/> Tambah Layanan
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-1">
                                  <button 
                                    onClick={() => handleOpenPOSForVisit(v.id, v.patientId, v.branchId, v.therapistId, "")}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                  >
                                    Ke Kasir
                                  </button>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1 w-full">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Hapus seluruh kunjungan ini?')) {
                                      group.forEach(g => handleDeleteVisit(g.id));
                                    }
                                  }}
                                  className="w-full text-left inline-flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors text-[10px] font-medium"
                                  title="Hapus Kunjungan"
                                >
                                  <Trash2 className="w-3 h-3" /> Hapus Kunjungan
                                </button>
                              </div>
                            </td>
                            <td className={tdClass}>
                              <div className="flex flex-col gap-2">
                                {Array.from(new Set(group.map(g => g.notes).filter(Boolean))).map((note, i) => (
                                  <p key={i} className="text-sm text-gray-600 whitespace-normal line-clamp-2 max-w-sm" title={note || ""}>
                                    {note}
                                  </p>
                                ))}
                                {group.every(g => !g.notes) && <span className="text-gray-400 italic text-sm">Tidak ada catatan</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              </div>

              
              {/* Desktop Pagination */}
              <div className="hidden md:block">
                {!loading && finalVisits.length > 0 && (
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                    totalItems={groupedFinalVisits.length} 
                    itemsPerPage={itemsPerPage} 
                  />
                )}
              </div>
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
                          <p className="text-xs text-gray-500 mt-1">
                            Laki-laki: <span className="font-bold">{recapData.summary.genderStats?.L || 0}</span> • Perempuan: <span className="font-bold">{recapData.summary.genderStats?.P || 0}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Omset (Lunas)</p>
                          <h4 className="text-2xl font-black text-blue-600 mt-1">{formatRupiah(recapData.summary.totalRevenue)}</h4>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <Check className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pembayaran</p>
                          <h4 className="text-sm font-bold text-gray-900 mt-1">Lunas: <span className="text-blue-600 font-extrabold">{recapData.summary.totalPaid}</span></h4>
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
                                <td className="px-6 py-4 font-bold text-blue-600">{formatRupiah(stat.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm mt-6">
                <p className="text-gray-500">Belum ada data kunjungan untuk bulan ini.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6 animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total Kunjungan</th>
                        <th className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-wider text-center">Lunas</th>
                        <th className="px-6 py-4 text-xs font-bold text-red-500 uppercase tracking-wider text-center">Belum Lunas</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Omset (Lunas)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monthlyData.map((stat: any) => (
                        <tr key={stat.date} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {new Date(stat.date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium text-center">{stat.totalVisits}</td>
                          <td className="px-6 py-4 font-bold text-blue-600 text-center">{stat.totalPaid}</td>
                          <td className="px-6 py-4 font-bold text-red-500 text-center">{stat.totalUnpaid}</td>
                          <td className="px-6 py-4 font-bold text-blue-600 text-right">{formatRupiah(stat.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50/80 border-t border-gray-200">
                      <tr>
                        <td className="px-6 py-4 font-bold text-gray-900 text-right">TOTAL BULAN INI</td>
                        <td className="px-6 py-4 font-black text-gray-900 text-center">{monthlyData.reduce((acc, curr) => acc + curr.totalVisits, 0)}</td>
                        <td className="px-6 py-4 font-black text-blue-600 text-center">{monthlyData.reduce((acc, curr) => acc + curr.totalPaid, 0)}</td>
                        <td className="px-6 py-4 font-black text-red-500 text-center">{monthlyData.reduce((acc, curr) => acc + curr.totalUnpaid, 0)}</td>
                        <td className="px-6 py-4 font-black text-blue-600 text-right">{formatRupiah(monthlyData.reduce((acc, curr) => acc + curr.totalRevenue, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
                    className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium cursor-pointer"
                  />
                </div>
                <select
                  value={historyPaymentFilter}
                  onChange={e => setHistoryPaymentFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 font-medium text-sm transition-all cursor-pointer"
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
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
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
                  <p className="text-2xl font-extrabold text-blue-600 mt-1">
                    {formatRupiah(filteredInvoiceHistory.reduce((sum, inv) => sum + inv.grandTotal, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Cash</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {formatRupiah(filteredInvoiceHistory.reduce((sum, inv) => {
                      if (inv.paymentMethod === "CASH") return sum + inv.grandTotal;
                      if (inv.paymentMethod === "SPLIT" && inv.splitPayments) {
                        try {
                          const splits = JSON.parse(inv.splitPayments);
                          const cashSplit = splits.find((s: any) => s.method === "CASH");
                          if (cashSplit) {
                            let cashAmt = cashSplit.amount;
                            if (inv.changeAmount > 0) cashAmt -= inv.changeAmount;
                            return sum + Math.max(0, cashAmt);
                          }
                        } catch (e) {}
                      }
                      return sum;
                    }, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Non-Cash</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {formatRupiah(filteredInvoiceHistory.reduce((sum, inv) => {
                      if (inv.paymentMethod === "SPLIT" && inv.splitPayments) {
                        try {
                          const splits = JSON.parse(inv.splitPayments);
                          const nonCash = splits.filter((s: any) => s.method !== "CASH");
                          return sum + nonCash.reduce((acc: number, s: any) => acc + s.amount, 0);
                        } catch (e) {}
                      }
                      if (inv.paymentMethod !== "CASH" && inv.paymentMethod !== "SPLIT") return sum + inv.grandTotal;
                      return sum;
                    }, 0))}
                  </p>
                </div>
              </div>
            )}

            {/* Invoice List */}
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                              {inv.paymentMethod === "SPLIT" && inv.splitPayments ? (
                                <div className="flex flex-col items-center gap-1">
                                  {(() => {
                                    try {
                                      const splits = JSON.parse(inv.splitPayments);
                                      return splits.map((sp: any, idx: number) => (
                                        <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                                          sp.method === "CASH" ? "border-blue-200 bg-blue-50 text-blue-700" :
                                          sp.method === "DEBIT" ? "border-blue-200 bg-blue-50 text-blue-700" :
                                          "border-purple-200 bg-purple-50 text-purple-700"
                                        }`}>
                                          {sp.method}: {formatRupiah(sp.amount)}
                                        </span>
                                      ));
                                    } catch (e) {
                                      return <span className="text-xs text-gray-500">SPLIT</span>;
                                    }
                                  })()}
                                </div>
                              ) : (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  inv.paymentMethod === "CASH" ? "bg-blue-50 text-blue-700" :
                                  inv.paymentMethod === "DEBIT" ? "bg-blue-50 text-blue-700" :
                                  "bg-purple-50 text-purple-700"
                                }`}>
                                  {inv.paymentMethod}
                                </span>
                              )}
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
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                          <CheckCircle2 className="h-8 w-8 text-blue-500" />
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
                              const msg = encodeURIComponent(`Halo Kak ${rp.patient.name},\nApa kabar? Semoga selalu sehat ya.\n\nKami dari Radja Bekam menyadari sudah ${rp.daysSinceLastVisit} hari sejak kunjungan terakhir Kakak. Yuk jaga kesehatan dengan rutinitas terapi bersama kami lagi. Ada promo khusus menanti Kakak!\n\nSilakan balas pesan ini untuk reservasi.`);
                              window.open(`https://wa.me/${rp.patient.phone.replace(/^0/, '62')}?text=${msg}`, "_blank");
                            }}
                            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
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

      {/* Patient History Modal */}
      {selectedPatientHistoryId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-0 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative transform transition-all animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 z-10"></div>
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Riwayat Kunjungan Pasien</h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5 flex items-center gap-3">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1.5 text-gray-400" />
                    {getPatientName(selectedPatientHistoryId)}
                  </span>
                  <span className="flex items-center text-gray-400 font-normal">
                    <Phone className="w-3 h-3 mr-1.5" />
                    {patients.find(p => p.id === selectedPatientHistoryId)?.phone || "-"}
                  </span>
                </p>
              </div>
              <button onClick={() => setSelectedPatientHistoryId(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
              <div className="space-y-4">
                {(() => {
                  const patientVisits = visits
                    .filter(v => v.patientId === selectedPatientHistoryId)
                    .sort((a, b) => {
                      const dateA = new Date(`${a.visitDate}T${(a.visitTime || '00:00').replace('.', ':')}:00`).getTime();
                      const dateB = new Date(`${b.visitDate}T${(b.visitTime || '00:00').replace('.', ':')}:00`).getTime();
                      return dateB - dateA;
                    });

                  const groupedVisits = patientVisits.reduce((acc, visit) => {
                    const key = `${visit.visitDate}_${visit.visitTime}`;
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(visit);
                    return acc;
                  }, {} as Record<string, typeof patientVisits>);

                  const groupedArray = Object.entries(groupedVisits).map(([key, groupVisits]) => ({
                    key,
                    visits: groupVisits,
                    sortTime: new Date(`${groupVisits[0].visitDate}T${(groupVisits[0].visitTime || '00:00').replace('.', ':')}:00`).getTime()
                  })).sort((a, b) => b.sortTime - a.sortTime);

                  return groupedArray.map((group, idx, arr) => {
                    const firstVisit = group.visits[0];
                    const uniqueTherapists = Array.from(new Set(group.visits.map(v => v.therapistId)));
                    const uniqueBranches = Array.from(new Set(group.visits.map(v => v.branchId)));
                    const uniqueNotes = Array.from(new Set(group.visits.map(v => v.notes).filter(Boolean)));
                    
                    return (
                      <div key={group.key} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-400 to-blue-500"></div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pl-2">
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-900 text-lg">{firstVisit.visitDate.split('-').reverse().join('/')}</span>
                              <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-gray-200">
                                <Clock className="w-3.5 h-3.5"/> {firstVisit.visitTime}
                              </span>
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 uppercase tracking-wide">
                                Kunjungan #{arr.length - idx}
                              </span>
                              {firstVisit.paymentStatus === "PAID" && (
                                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-wide flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5"/> Lunas
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Layanan</span>
                                <div className="flex flex-col gap-1.5">
                                  {group.visits.map(v => (
                                    <div key={v.id} className="flex items-center gap-2 text-gray-800 font-medium">
                                      <Activity className="w-4 h-4 text-blue-500"/> {getServiceName(v.serviceId)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terapis</span>
                                <div className="flex flex-col gap-1.5">
                                  {uniqueTherapists.map(tId => (
                                    <div key={tId} className="flex items-center gap-2 text-gray-800 font-medium">
                                      <User className="w-4 h-4 text-indigo-400"/> {getTherapistName(tId)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cabang</span>
                                <div className="flex flex-col gap-1.5">
                                  {uniqueBranches.map(bId => (
                                    <div key={bId} className="flex items-center gap-2 text-gray-800 font-medium">
                                      <Store className="w-4 h-4 text-amber-500"/> {getBranchName(bId)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="sm:max-w-xs w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                              <FileText className="w-3.5 h-3.5" /> Catatan Medis
                            </div>
                            <div className="flex flex-col gap-2">
                              {uniqueNotes.length > 0 ? uniqueNotes.map((note, idx) => (
                                <p key={idx} className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                  {note}
                                </p>
                              )) : (
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap italic text-gray-400">
                                  Tidak ada catatan medis untuk kunjungan ini.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedPatientHistoryId(null)}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus Kunjungan?"
        message="Apakah Anda yakin ingin menghapus data kunjungan ini? Tindakan ini tidak dapat dibatalkan dan semua data terkait akan hilang permanen."
        onConfirm={confirmDeleteVisit}
        onCancel={() => {
          setDeleteModalOpen(false);
          setVisitToDelete(null);
        }}
        isLoading={isDeleting}
        variant="danger"
      />
      
      {/* Finish Confirmation Modal */}
      <ConfirmModal
        isOpen={finishModalOpen}
        title="Selesaikan Kunjungan?"
        message="Apakah Anda yakin ingin menandai layanan kunjungan ini sebagai selesai sekarang?"
        confirmText="Ya, Selesai"
        cancelText="Batal"
        onConfirm={confirmFinishVisit}
        onCancel={() => {
          setFinishModalOpen(false);
          setVisitToFinish(null);
        }}
        isLoading={isFinishing}
        variant="info"
      />

      </div>
    </div>
  );
}
