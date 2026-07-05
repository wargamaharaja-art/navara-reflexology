"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PWARedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if the app is running as a PWA (standalone mode)
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
      
      if (isStandalone) {
        // Force redirect to /admin if they are on the landing page in PWA
        router.replace("/admin");
      }
    }
  }, [router]);

  return null;
}
