"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

export function FloatingWhatsApp({ phone }: { phone: string }) {
  // Format phone number (remove leading 0 or +, add 62)
  const formattedPhone = phone?.startsWith("0") ? "62" + phone.slice(1) : phone?.replace(/[^0-9]/g, "");

  return (
    <Link
      href={`https://wa.me/${formattedPhone}?text=Halo%20Radja%20Bekam,%20saya%20ingin%20bertanya%20seputar%20layanan%20terapi.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] hover:scale-110 transition-all duration-300 flex items-center justify-center animate-bounce-slow"
      aria-label="Chat WhatsApp"
    >
      <MessageCircle className="h-8 w-8" />
    </Link>
  );
}
