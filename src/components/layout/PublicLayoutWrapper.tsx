"use client";

import { usePathname } from "next/navigation";

export function PublicLayoutWrapper({ 
  children,
  navbar,
  footer,
  whatsapp
}: { 
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
  whatsapp: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <>
      {navbar}
      <main className={`min-h-screen ${pathname === "/" ? "" : "pt-20"}`}>{children}</main>
      {footer}
      {whatsapp}
    </>
  );
}
