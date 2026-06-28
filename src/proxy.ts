import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteksi halaman admin selain halaman login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Di mode development, bypass proteksi redirect agar mempermudah testing di HP
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    const session = request.cookies.get("radja-bekam-session");
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
