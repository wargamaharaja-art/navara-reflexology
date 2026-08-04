import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route to Permission Mapping
// Diurutkan dari path terdalam ke terluar (untuk pencocokan startsWith yang aman)
const rbacMap = [
  { route: '/admin/promo', permission: 'PROMO_BEKAM' },
  { route: '/admin/settings/users', permission: 'PENGATURAN_PENGGUNA' },
  { route: '/admin/settings/commissions', permission: 'PENGATURAN_KOMISI' },
  { route: '/admin/system-logs', permission: 'SYSTEM_LOGS' },
  { route: '/admin/settings', permission: 'SUPER_ADMIN_ONLY' }, // Special marker
  { route: '/admin/finance/expenses', permission: 'KEUANGAN_PENGELUARAN' },
  { route: '/admin/finance/cash-mutations', permission: 'KEUANGAN_MUTASI' },
  { route: '/admin/finance/laba-rugi', permission: 'KEUANGAN_LABARUGI' },
  { route: '/admin/finance/buku-besar', permission: 'KEUANGAN_LABARUGI' },
  { route: '/admin/finance', permission: 'KEUANGAN_PEMASUKAN' },
  { route: '/admin/therapists/mutations', permission: 'PEGAWAI_MUTASI' },
  { route: '/admin/therapists/reports', permission: 'PEGAWAI_SLIP' },
  { route: '/admin/therapists', permission: 'PEGAWAI_TERAPIS' },
  { route: '/admin/staff/payroll', permission: 'PEGAWAI_SLIP' },
  { route: '/admin/staff', permission: 'PEGAWAI_STAFF' },
  { route: '/admin/reservations', permission: 'RESERVASI_ONLINE' },
  { route: '/admin/attendance', permission: 'PEGAWAI_ABSENSI' },
  { route: '/admin/inventory', permission: 'INVENTARIS_BARANG' },
  { route: '/admin/branches', permission: 'PENGATURAN_CABANG' },
  { route: '/admin/services', permission: 'LAYANAN_TERAPI' },
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply to /admin routes
  if (pathname.startsWith('/admin')) {
    // Exclude public admin routes like login
    if (pathname === '/admin/login' || pathname === '/admin/unauthorized') return NextResponse.next();
    
    const sessionCookie = request.cookies.get('navara-session');
    
    // Fallback bypass dev environment if absolutely no cookie (like what getSession does)
    // if (!sessionCookie && process.env.NODE_ENV === 'development') {
    //   return NextResponse.next();
    // }

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const parts = sessionCookie.value.split(".");
      if (parts.length !== 2) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // atob is available in Edge Runtime for Base64 decoding
      const dataStr = atob(parts[0]);
      const session = JSON.parse(dataStr);
      const permissions: string[] = session.permissions || [];
      const role: string = session.role;

      // Super Admin bypasses all checks
      if (role === 'SUPER_ADMIN') {
        return NextResponse.next();
      }

      // Check specific multi-permission paths
      if (pathname.startsWith('/admin/visits')) {
        if (!permissions.includes('BUKUPASIEN_REKAMMEDIS')) {
          return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
        }
        return NextResponse.next(); // Skip further loops if matched
      }
      
      if (pathname.startsWith('/admin/transactions')) {
        if (!permissions.includes('KEUANGAN_PEMASUKAN') && !permissions.includes('BUKUPASIEN_REKAMMEDIS')) {
          return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
        }
        return NextResponse.next();
      }

      // General map checking
      for (const mapping of rbacMap) {
        if (pathname.startsWith(mapping.route)) {
          if (mapping.permission === 'SUPER_ADMIN_ONLY') {
            // Since role !== SUPER_ADMIN at this point, block
            return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
          }
          
          if (!permissions.includes(mapping.permission)) {
            return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
          }
          
          // Found matching mapping and has permission, break out of loop to allow
          break;
        }
      }

    } catch (error) {
      // Failed to parse token
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Handle other APIs or public routes
  return NextResponse.next();
}

export const config = {
  // Matches all /admin routes except for static files/assets
  matcher: ['/admin/:path*'],
}
