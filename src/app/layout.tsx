import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
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
  title: "Navara Reflexology - Admin Dashboard",
  description: "Management System for Navara Reflexology",
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
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <PWAInstall />
        {children}
      </body>
    </html>
  );
}
