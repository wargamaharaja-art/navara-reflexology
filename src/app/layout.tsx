import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { PublicLayoutWrapper } from "@/components/layout/PublicLayoutWrapper";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";
import { db } from "@/lib/db";
import { settings, branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PWAInstall } from "@/components/ui/PWAInstall";

export const revalidate = 0;

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Navara Reflexology - Solusi Teman Sehatku",
  description: "Klinik refleksi profesional, bersih, dan bersertifikat.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Navara Reflexology",
  },
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settingsData = await db.select().from(settings).where(eq(settings.id, "company_info")).limit(1);
  const companyInfo = settingsData[0] || { whatsappNumber: "6281234567890" };
  
  const activeBranches = await db.select().from(branches).where(eq(branches.isActive, true));

  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <PWAInstall />
        <PublicLayoutWrapper 
          navbar={<Navbar key="navbar" settings={companyInfo} branches={activeBranches} />}
          footer={<Footer key="footer" />}
          whatsapp={<FloatingWhatsApp key="whatsapp" phone={companyInfo.whatsappNumber || "6281234567890"} />}
        >
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}
