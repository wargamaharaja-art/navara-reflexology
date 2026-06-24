"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/visits?tab=pos");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
