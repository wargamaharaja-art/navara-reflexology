"use client";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards w-full">
      {children}
    </div>
  );
}
