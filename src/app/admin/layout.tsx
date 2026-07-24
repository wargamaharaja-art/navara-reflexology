"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, CalendarCheck, Users, Package, Wallet, Settings, X, Inbox, MapPin, TrendingUp, TrendingDown, Activity, ShieldCheck, ChevronDown, Store, Clock, Award, Receipt, FileText, BookOpen, Home, User, Gift } from "lucide-react";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [pendingReservations, setPendingReservations] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Keuangan: false,
    Pengaturan: false,
  });



  useEffect(() => {
    const isKeuanganActive =
      pathname === "/admin" ||
      pathname === "/admin/finance" ||
      pathname?.startsWith("/admin/finance/");

    const isPengaturanActive =
      pathname === "/admin/settings" ||
      pathname === "/admin/branches" ||
      pathname?.startsWith("/admin/settings/") ||
      pathname?.startsWith("/admin/branches/");

    const isPegawaiActive =
      pathname === "/admin/therapists" ||
      pathname === "/admin/staff" ||
      pathname?.startsWith("/admin/therapists") ||
      pathname?.startsWith("/admin/staff") ||
      pathname === "/admin/attendance";

    setExpandedMenus({
      Keuangan: isKeuanganActive,
      Pengaturan: isPengaturanActive,
      Pegawai: isPegawaiActive,
    });
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  useEffect(() => {
    // ISS-002: Redirect RBAC dihapus dari sini — tangani via middleware server-side.
    // useEffect ini hanya mengurus data UI: session, branch cookie, pending count, branch list.
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session?t=" + new Date().getTime(), { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);

          // Read selected branch from cookie
          const match = document.cookie.match(new RegExp('(^| )navara-selected-branch=([^;]+)'));
          const currentBranch = match ? match[2] : "ALL";
          setSelectedBranch(currentBranch);

          // Fetch pending reservations
          try {
            const pendingRes = await fetch("/api/reservations/pending-count");
            if (pendingRes.ok) {
              const pendingData = await pendingRes.json();
              if (pendingData.success) {
                setPendingReservations(pendingData.count);
              }
            }
          } catch (e) {
            console.error("Failed to fetch pending count", e);
          }

          // Fetch branches for branch name lookups and switcher
          try {
            const branchesRes = await fetch("/api/branches");
            if (branchesRes.ok) {
              const branchesData = await branchesRes.json();
              setBranches(branchesData.data || []);
            }
          } catch (e) {
            console.error("Failed to fetch branches", e);
          }
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    };

    if (pathname !== "/admin/login") {
      checkSession();
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
    document.cookie = `navara-selected-branch=${value}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.location.reload();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // Jika halaman login, jangan tampilkan sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Memuat halaman panel admin...</p>
      </div>
    );
  }



  const bottomNavLinksRaw = [
    { name: "Dashboard", href: "/admin", icon: TrendingUp },
    { name: "Visits", href: "/admin/visits", icon: CalendarCheck },
    { name: "Reservasi", href: "/admin/reservations", icon: Inbox, hasBadge: true },
    { name: "Finance", href: "/admin/finance", icon: Wallet },
  ];

  const bottomNavLinks = bottomNavLinksRaw.filter(link => {
    const perms = session?.permissions || [];
    if (link.name === "Dashboard") return perms.includes("DASHBOARD_ANALITIK");
    if (link.name === "Visits") return perms.includes("BUKUPASIEN_REKAMMEDIS");
    if (link.name === "Reservasi") return perms.includes("RESERVASI_ONLINE");
    if (link.name === "Finance") return perms.includes("KEUANGAN_PEMASUKAN") || perms.includes("KEUANGAN_PENGELUARAN") || perms.includes("KEUANGAN_MUTASI") || perms.includes("KEUANGAN_LABARUGI");
    return false;
  });

  const activeBranchObj = branches.find(b => b.id === selectedBranch);
  const isRadjaBekam = activeBranchObj?.brand === "RADJA_BEKAM";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-radja-bekam {
          --theme-emerald-50: var(--color-blue-50);
          --theme-emerald-100: var(--color-blue-100);
          --theme-emerald-200: var(--color-blue-200);
          --theme-emerald-300: var(--color-blue-300);
          --theme-emerald-400: var(--color-amber-400);
          --theme-emerald-500: var(--color-blue-500);
          --theme-emerald-600: var(--color-blue-600);
          --theme-emerald-700: var(--color-blue-700);
          --theme-emerald-800: var(--color-blue-800);
          --theme-emerald-900: var(--color-blue-900);
          --theme-emerald-950: var(--color-blue-950);
        }
        .theme-navara {
          --theme-emerald-50: #ecfdf5;
          --theme-emerald-100: #d1fae5;
          --theme-emerald-200: #a7f3d0;
          --theme-emerald-300: #6ee7b7;
          --theme-emerald-400: #34d399;
          --theme-emerald-500: #10b981;
          --theme-emerald-600: #059669;
          --theme-emerald-700: #047857;
          --theme-emerald-800: #065f46;
          --theme-emerald-900: #064e3b;
          --theme-emerald-950: #022c22;
        }
        .theme-maharaja {
          --theme-emerald-50: var(--color-slate-50);
          --theme-emerald-100: var(--color-slate-100);
          --theme-emerald-200: var(--color-slate-200);
          --theme-emerald-300: var(--color-amber-300);
          --theme-emerald-400: var(--color-amber-400);
          --theme-emerald-500: var(--color-amber-500);
          --theme-emerald-600: var(--color-slate-700);
          --theme-emerald-700: var(--color-slate-800);
          --theme-emerald-800: var(--color-slate-900);
          --theme-emerald-900: #0f172a;
          --theme-emerald-950: #020617;
        }
      `}} />
      <div className={`min-h-screen bg-slate-50 md:bg-gradient-to-b md:from-emerald-100/30 md:via-emerald-50/10 md:to-slate-50 flex flex-col md:flex-row pb-24 md:pb-0 ${selectedBranch === 'ALL' ? 'theme-maharaja' : isRadjaBekam ? 'theme-radja-bekam' : 'theme-navara'}`}>
      {/* Mobile Header di-pindahkan ke page.tsx agar menyatu dengan desain kartu hijau */}
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col border-r border-emerald-800/50 shadow-2xl
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:sticky md:top-0 md:h-screen md:translate-x-0
      `}>
        <div className="flex items-center justify-between md:justify-start px-6 py-6 border-b border-background/10">
          <Link href="/admin" className="hover:opacity-90 transition-opacity flex items-center gap-3.5">
            <div className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center justify-center border border-emerald-800/30 overflow-hidden ${selectedBranch === "ALL" ? "p-0 w-[56px] h-[56px]" : "p-2"}`}>
              <Image src={selectedBranch === "ALL" ? "/maharaja-logo.jpg" : "/navara-logo.png"} alt={selectedBranch === "ALL" ? "Maharaja Group Logo" : isRadjaBekam ? "Radja Bekam Logo" : "Navara Reflexology Logo"} width={56} height={56} className={`${selectedBranch === "ALL" ? "w-full h-full object-cover scale-[1.15]" : "w-10 h-10 object-contain drop-shadow-sm"}`} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">
                <span className="text-white">{selectedBranch === "ALL" ? "Maharaja" : isRadjaBekam ? "Radja" : "Navara"}</span>{" "}
                <span className="text-emerald-400">{selectedBranch === "ALL" ? "Group" : isRadjaBekam ? "Bekam" : "Reflexology"}</span>
              </h1>
              <span className="text-white/50 font-medium text-xs tracking-wide">Admin Panel</span>
            </div>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-background/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Card & Branch Selector */}
        {session && (
          <div className="px-5 py-5 border-b border-white/5">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-300/30 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-sm text-white truncate drop-shadow-sm">{session.name}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-200/80 font-medium tracking-wide uppercase">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {session.role === "SUPER_ADMIN" ? "Super Admin" :
                      session.role === "INVESTOR" ? "Investor" :
                        session.role === "THERAPIST" ? "Terapis" :
                          session.role === "CASHIER" ? "Kasir" : "Admin Cabang"}
                  </span>
                </div>
              </div>
            </div>

            {/* Branch Selector / Display */}
            {(session.role === "SUPER_ADMIN" || session.role === "INVESTOR") ? (
              <div className="mt-4 relative" ref={dropdownRef}>
                <label className="block text-[10px] font-bold tracking-wider text-background/50 uppercase mb-1.5">Pilih Cabang Aktif</label>
                <div 
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl px-3.5 py-2.5 cursor-pointer transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)] group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Store className="w-4 h-4 text-emerald-300 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold truncate">
                      {selectedBranch === "ALL" 
                        ? "Semua Cabang (Pusat)" 
                        : branches.find(b => b.id === selectedBranch)?.name || "Pilih Cabang"}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-300 ${isBranchDropdownOpen ? "rotate-180" : ""}`} />
                </div>
                
                {/* Custom Dropdown Menu */}
                {isBranchDropdownOpen && (
                  <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] border border-emerald-100/50 overflow-hidden transform origin-top animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
                      <div 
                        onClick={() => { handleBranchChange("ALL"); setIsBranchDropdownOpen(false); }}
                        className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${selectedBranch === "ALL" ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${selectedBranch === "ALL" ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 bg-transparent"}`}>
                          {selectedBranch === "ALL" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm ${selectedBranch === "ALL" ? "font-bold text-emerald-800" : "font-medium text-gray-700"}`}>Semua Cabang (Pusat)</span>
                      </div>
                      
                      {Array.from(new Set(branches.map(b => b.brand))).map((brand, i) => (
                        <div key={brand}>
                          <div className="px-4 py-2 bg-gray-50/90 border-y border-gray-100 text-[10px] font-black uppercase tracking-widest text-emerald-800/50 sticky top-0 backdrop-blur-sm z-10 flex items-center gap-2">
                            {brand === 'RADJA_BEKAM' ? 'Radja Bekam' : 'Navara Reflexology'}
                          </div>
                          {branches.filter(b => b.brand === brand).map(b => (
                            <div 
                              key={b.id}
                              onClick={() => { handleBranchChange(b.id); setIsBranchDropdownOpen(false); }}
                              className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${selectedBranch === b.id ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${selectedBranch === b.id ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 bg-transparent"}`}>
                                {selectedBranch === b.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className={`text-sm ${selectedBranch === b.id ? "font-bold text-emerald-800" : "font-medium text-gray-700"}`}>{b.name}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 bg-background/15 rounded-lg px-3 py-2 flex items-center gap-2 border border-background/10 overflow-hidden">
                <Store className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-semibold text-background truncate">Cabang: {session.branchId}</span>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {(() => {
            const navLinks = [
              { name: "Dashboard", href: "/admin", icon: TrendingUp },
              { name: "Reservasi Online", href: "/admin/reservations", icon: Inbox },
              { name: "Promo Bekam Gratis", href: "/admin/promo", icon: Gift },
              { name: "Buku Pasien", href: "/admin/visits", icon: CalendarCheck },
              { name: "Transaksi Pelanggan", href: "/admin/transactions", icon: BookOpen },
              { name: "Layanan Terapi", href: "/admin/services", icon: Activity },
              {
                name: "Pegawai",
                href: "/admin/therapists",
                icon: Users,
                subItems: [
                  { name: "Data Terapis", href: "/admin/therapists", icon: Users },
                  { name: "Data Staff", href: "/admin/staff", icon: Users },
                  { name: "Absensi Pegawai", href: "/admin/attendance", icon: Clock },
                  { name: "Surat Mutasi", href: "/admin/therapists/mutations", icon: FileText },
                  { name: "Slip Gaji Terapis", href: "/admin/therapists/reports", icon: Award },
                  { name: "Slip Gaji Staff", href: "/admin/staff/payroll", icon: Award },
                ]
              },
              { name: "Inventaris", href: "/admin/inventory", icon: Package },
              {
                name: "Keuangan",
                href: "/admin/finance",
                icon: Wallet,
                subItems: [
                  { name: "Pemasukan & Pengeluaran", href: "/admin/finance", icon: Wallet },
                  { name: "Pengeluaran Klinik", href: "/admin/finance/expenses", icon: TrendingDown },
                  { name: "Mutasi Kas", href: "/admin/finance/cash-mutations", icon: Wallet },
                  { name: "Laporan Laba Rugi", href: "/admin/finance/laba-rugi", icon: FileText },
                  { name: "Buku Besar", href: "/admin/finance/buku-besar", icon: Receipt },
                ]
              },
              {
                name: "Pengaturan",
                href: "/admin/settings",
                icon: Settings,
                subItems: [
                  ...(session?.role === "SUPER_ADMIN" ? [
                    { name: "Info Perusahaan", href: "/admin/settings", icon: Store },
                    { name: "Cabang", href: "/admin/branches", icon: MapPin },
                    { name: "Pengguna Sistem", href: "/admin/settings/users", icon: Users },
                    { name: "System Logs", href: "/admin/system-logs", icon: Activity }
                  ] : []),
                  { name: "Sinkronisasi Komisi", href: "/admin/settings/commissions", icon: Award }
                ]
              },
            ];

            // Permissions filtering
            const filteredNavLinks = navLinks.filter(link => {
              const perms = session?.permissions || [];

              if (link.name === "Dashboard") return perms.includes("DASHBOARD_ANALITIK");
              if (link.name === "Reservasi Online") return perms.includes("RESERVASI_ONLINE");
              
              if (link.name === "Promo Bekam Gratis") {
                const hasPermission = perms.includes("RESERVASI_ONLINE") || session?.role === "SUPER_ADMIN";
                if (!hasPermission) return false;
                
                const activeBranchId = (session?.role === "SUPER_ADMIN" || session?.role === "INVESTOR") ? selectedBranch : session?.branchId;
                const isJatiasih = activeBranchId === "ALL" || branches.some(b => b.id === activeBranchId && b.name.toLowerCase().includes("jatiasih"));
                return isJatiasih;
              }

              if (link.name === "Buku Pasien") return perms.includes("BUKUPASIEN_REKAMMEDIS");
              if (link.name === "Transaksi Pelanggan") return perms.includes("KEUANGAN_PEMASUKAN") || perms.includes("BUKUPASIEN_REKAMMEDIS");
              if (link.name === "Layanan Terapi") return perms.includes("PENGATURAN_CABANG"); // Opsional

              if (link.name === "Pegawai") {
                link.subItems = link.subItems?.filter(sub => {
                  if (sub.name === "Data Terapis") return perms.includes("PEGAWAI_TERAPIS");
                  if (sub.name === "Data Staff") return perms.includes("PEGAWAI_STAFF");
                  if (sub.name === "Absensi Pegawai") return perms.includes("PEGAWAI_ABSENSI");
                  if (sub.name === "Surat Mutasi") return perms.includes("PEGAWAI_MUTASI");
                  if (sub.name === "Slip Gaji Terapis" || sub.name === "Slip Gaji Staff") return perms.includes("PEGAWAI_SLIP");
                  return false;
                });
                return (link.subItems && link.subItems.length > 0);
              }

              if (link.name === "Inventaris") return perms.includes("INVENTARIS_BARANG");

              if (link.name === "Keuangan") {
                link.subItems = link.subItems?.filter(sub => {
                  if (sub.name === "Pemasukan & Pengeluaran") return perms.includes("KEUANGAN_PEMASUKAN");
                  if (sub.name === "Pengeluaran Klinik") return perms.includes("KEUANGAN_PENGELUARAN");
                  if (sub.name === "Mutasi Kas") return perms.includes("KEUANGAN_MUTASI");
                  if (sub.name === "Laporan Laba Rugi") return perms.includes("KEUANGAN_LABARUGI");
                  if (sub.name === "Buku Besar") return perms.includes("KEUANGAN_LABARUGI");
                  return false;
                });
                return (link.subItems && link.subItems.length > 0);
              }

              if (link.name === "Pengaturan") {
                link.subItems = link.subItems?.filter(sub => {
                  if (sub.name === "Info Perusahaan") return session?.role === "SUPER_ADMIN";
                  if (sub.name === "Cabang") return perms.includes("PENGATURAN_CABANG");
                  if (sub.name === "Pengguna Sistem") return perms.includes("PENGATURAN_PENGGUNA");
                  if (sub.name === "Sinkronisasi Komisi") return perms.includes("PENGATURAN_KOMISI");
                  return false;
                });
                return (link.subItems && link.subItems.length > 0);
              }

              return false;
            });

            return filteredNavLinks.map((link) => {
              const hasSubItems = link.subItems && link.subItems.length > 0;
              const isExpanded = expandedMenus[link.name] || false;

              const isExactActive = pathname === link.href;
              const isParentActive = isExactActive || (link.href !== "/admin" && pathname?.startsWith(link.href || ""));
              const Icon = link.icon;

              return (
                <div key={link.name} className="space-y-1">
                  <Link
                    href={link.href || "#"}
                    onClick={(e) => {
                      if (hasSubItems) {
                        e.preventDefault();
                        toggleMenu(link.name);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 relative group ${isExactActive
                        ? "bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-300 font-bold border border-emerald-400/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md"
                        : isParentActive
                          ? "bg-white/5 text-emerald-100 font-medium border border-transparent"
                          : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                  >
                    {isExactActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-400 rounded-r-full" />}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {link.name === "Reservasi Online" && pendingReservations > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-foreground"></span>
                          </span>
                        )}
                      </div>
                      <span>{link.name}</span>
                    </div>
                    {hasSubItems && (
                      <ChevronDown
                        className={`h-4 w-4 text-background/60 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </Link>

                  {hasSubItems && isExpanded && (
                    <div className="space-y-1 ml-6 pl-4 border-l border-background/10 animate-in fade-in slide-in-from-top-1 duration-150">
                      {link.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${isSubActive
                                ? "bg-emerald-600 text-white font-semibold shadow-md"
                                : "text-white/60 hover:bg-white/10 hover:text-white"
                              }`}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </nav>

        <div className="p-4 border-t border-background/10 pb-20 md:pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-3 rounded-lg text-background/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <main className="w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Seabank Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] flex justify-between items-center z-40 px-2 h-[70px] pb-safe">
        
        {/* 1. Beranda */}
        <Link href="/admin" className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${pathname === "/admin" ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}>
           <Home className="w-[22px] h-[22px]" />
           <span className="text-[10px] font-semibold">Beranda</span>
        </Link>
        
        {/* 2. Kunjungan */}
        <Link href="/admin/visits" className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${pathname?.startsWith("/admin/visits") ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}>
           <CalendarCheck className="w-[22px] h-[22px]" />
           <span className="text-[10px] font-semibold">Kunjungan</span>
        </Link>
        
        {/* 3. Reservasi (Center Popping Button) */}
        <div className="flex-1 flex justify-center h-full relative">
          <Link href="/admin/reservations" className="absolute -top-5 flex flex-col items-center justify-center group">
            <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.3)] border-4 border-white text-white z-50 group-active:scale-95 transition-transform relative">
               <Inbox className="w-6 h-6" />
               {pendingReservations > 0 && (
                  <span className="absolute 1 top-0 right-0 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                  </span>
               )}
            </div>
            <span className="text-[10px] text-gray-500 font-semibold mt-1 transition-colors group-hover:text-emerald-600">Reservasi</span>
          </Link>
        </div>

        {/* 4. Keuangan */}
        <Link href="/admin/finance" className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${pathname?.startsWith("/admin/finance") ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}>
           <Wallet className="w-[22px] h-[22px]" />
           <span className="text-[10px] font-semibold">Keuangan</span>
        </Link>
        
        {/* 5. Menu / Saya */}
        <button onClick={() => setIsMobileMenuOpen(true)} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isMobileMenuOpen ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}>
           <User className="w-[22px] h-[22px]" />
           <span className="text-[10px] font-semibold">Saya</span>
        </button>
        
      </div>
    </div>
    </>
  );
}
