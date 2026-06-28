"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, CalendarCheck, Users, Package, Wallet, Settings, X, Inbox, MapPin, TrendingUp, TrendingDown, Activity, ShieldCheck, ChevronDown, Store, Clock, Award, Receipt, FileText, BookOpen } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("ALL");
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
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);

          // Read selected branch from cookie
          const match = document.cookie.match(new RegExp('(^| )radja-bekam-selected-branch=([^;]+)'));
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

          // If Super Admin, fetch branches for switcher
          if (data.session.role === "SUPER_ADMIN") {
            const branchesRes = await fetch("/api/branches");
            if (branchesRes.ok) {
              const branchesData = await branchesRes.json();
              setBranches(branchesData.data || []);
            }
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
    document.cookie = `radja-bekam-selected-branch=${value}; path=/; max-age=${60 * 60 * 24 * 30}`;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100/60 via-emerald-50/30 to-slate-50 flex flex-col md:flex-row pb-28 md:pb-0">
      {/* Mobile Header */}
      <div className="md:hidden bg-transparent text-gray-900 px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-extrabold tracking-tight">
          <span className="text-green-600">Navara</span>{" "}
          <span className="text-gray-900">Reflexology</span>{" "}
          <span className="text-green-500/80 font-medium text-sm">Admin</span>
        </h1>
        {session && (
          <div className="text-xs text-gray-700 font-bold bg-white/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/60 shadow-sm max-w-[120px] truncate">
            <Store className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <span className="truncate">{session.role === "SUPER_ADMIN" ? "Pusat" : session.branchId}</span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-emerald-950 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:sticky md:top-0 md:h-screen md:translate-x-0
      `}>
        <div className="flex items-center justify-between md:justify-start px-6 py-6 border-b border-background/10">
          <Link href="/admin" className="hover:opacity-90 transition-opacity">
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="text-white">Navara</span>{" "}
              <span className="text-emerald-400">Reflexology</span><br className="hidden md:block"/>
              <span className="text-white/60 font-normal text-sm md:text-base mt-1 md:block">Admin Panel</span>
            </h1>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-background/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Card & Branch Selector */}
        {session && (
          <div className="px-6 py-4 border-b border-background/10 bg-background/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-background truncate">{session.name}</p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-background/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
              <div className="mt-4">
                <label className="block text-[10px] font-bold tracking-wider text-background/50 uppercase mb-1.5">Pilih Cabang Aktif</label>
                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full text-xs font-semibold bg-background/10 hover:bg-background/20 border border-background/25 text-background rounded-lg px-3 py-2 outline-none cursor-pointer appearance-none pr-8 transition-colors"
                  >
                    <option value="ALL" className="text-foreground bg-white">Semua Cabang (Pusat)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id} className="text-foreground bg-white">{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-background/60 pointer-events-none" />
                </div>
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
                    { name: "Pengguna Sistem", href: "/admin/settings/users", icon: Users }
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
              if (link.name === "Buku Pasien") return perms.includes("BUKUPASIEN_REKAMMEDIS");
              if (link.name === "Transaksi Pelanggan") return perms.includes("KEUANGAN_PEMASUKAN") || perms.includes("BUKUPASIEN_REKAMMEDIS");
              if (link.name === "Layanan Terapi") return perms.includes("PENGATURAN_CABANG"); // Opsional
              
              if (link.name === "Pegawai") {
                link.subItems = link.subItems?.filter(sub => {
                  if (sub.name === "Data Terapis") return perms.includes("PEGAWAI_TERAPIS");
                  if (sub.name === "Data Staff") return perms.includes("PEGAWAI_STAFF");
                  if (sub.name === "Absensi Pegawai") return perms.includes("PEGAWAI_ABSENSI");
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
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${
                      isExactActive 
                        ? "bg-emerald-600 text-white font-semibold shadow-md" 
                        : isParentActive
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
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
                        className={`h-4 w-4 text-background/60 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
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
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                              isSubActive 
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full flex justify-between items-center z-40 p-2 pb-safe-offset-2">
        {bottomNavLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <div className={`relative flex items-center justify-center w-10 h-10 transition-all duration-300 ${isActive ? "bg-green-600 text-white rounded-full shadow-md" : "bg-transparent group-hover:scale-110"}`}>
                <Icon className="h-[20px] w-[20px]" />
                {link.hasBadge && pendingReservations > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${isMobileMenuOpen ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className={`relative flex items-center justify-center w-10 h-10 transition-all duration-300 ${isMobileMenuOpen ? "bg-green-600 text-white rounded-full shadow-md" : "bg-transparent group-hover:scale-110"}`}>
            <Menu className="h-[20px] w-[20px]" />
          </div>
        </button>
      </div>
    </div>
  );
}
