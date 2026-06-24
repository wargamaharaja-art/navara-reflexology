"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, MapPin, Phone, Clock, Activity, Droplets, Stethoscope, PlusCircle, ArrowRight, Package, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar({ settings, branches = [] }: { settings?: any, branches?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { 
      name: "Services", 
      href: "/services",
      subItems: [
        { name: "Paket Treatment", href: "/services/paket-treatment", description: "Pilihan paket lengkap", icon: Package },
        { name: "Full Body Massages", href: "/services/full-body-massages", description: "Pijat relaksasi seluruh tubuh", icon: Heart },
        { name: "Refleksi", href: "/services/refleksi", description: "Relaksasi titik saraf", icon: Activity },
        { name: "Bekam", href: "/services/bekam", description: "Terapi detoksifikasi darah", icon: Droplets },
        { name: "Adds On", href: "/services/adds-on", description: "Layanan tambahan", icon: PlusCircle }
      ]
    },
    { name: "Cek Kesehatan", href: "/cek-kesehatan" },
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 inset-x-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100/50" 
          : "bg-white/50 backdrop-blur-md border-b border-white/40"
      )}
    >
      <div className={cn("container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300", scrolled ? "py-1" : "py-3")}>
        <div className="flex justify-between items-center h-28 transition-all duration-300">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Image 
                src="/navara-logo.png" 
                alt="Navara Reflexology Logo" 
                unoptimized
                width={250} 
                height={82} 
                className="h-24 w-auto group-hover:scale-105 transition-transform duration-300" 
                priority
                loading="eager"
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            {navLinks.map((link) => (
              link.subItems ? (
                <div key={link.name} className="relative group">
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-slate-700 hover:text-primary transition-colors text-base font-bold py-2 tracking-wide"
                  >
                    {link.name}
                    <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                  </Link>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-[320px] z-50">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-3 border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-emerald-500 to-accent"></div>
                      <div className="flex flex-col gap-1">
                        {link.subItems.map((sub: any) => (
                          <Link 
                            key={sub.name}
                            href={sub.href}
                            className="group/item flex items-start gap-4 p-3 rounded-xl hover:bg-emerald-50/80 transition-all duration-300"
                          >
                            {sub.icon && (
                              <div className="mt-0.5 flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100/50 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors duration-300">
                                <sub.icon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="block text-[15px] font-bold text-slate-800 group-hover/item:text-primary transition-colors">
                                  {sub.name}
                                </span>
                                <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300" />
                              </div>
                              {sub.description && (
                                <span className="block text-[13px] font-medium text-slate-500 mt-0.5">
                                  {sub.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-slate-700 hover:text-primary relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full text-base font-bold tracking-wide"
                >
                  {link.name}
                </Link>
              )
            ))}
            <Link
               href="/contact"
               className="bg-gradient-to-r from-primary to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all px-8 py-3 rounded-full font-bold text-base shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.5)] hover:-translate-y-0.5"
            >
               Hubungi Kami
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 hover:text-primary p-2 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Premium Full Screen */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full pt-32 px-6 pb-safe overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-4">
            {navLinks.map((link, idx) => (
              <div 
                key={link.name}
                className={cn(
                  "transition-all duration-500 transform",
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${isOpen ? 100 + idx * 50 : 0}ms` }}
              >
                <Link
                  href={link.href}
                  className="block text-3xl font-black text-slate-800 hover:text-primary transition-colors py-2"
                  onClick={() => !link.subItems && setIsOpen(false)}
                >
                  {link.name}
                </Link>
                {link.subItems && (
                  <div className="mt-4 mb-6 grid grid-cols-1 gap-3">
                    {link.subItems.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 hover:bg-emerald-50 border border-slate-100 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {sub.icon && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] flex items-center justify-center text-primary">
                            <sub.icon className="w-6 h-6" />
                          </div>
                        )}
                        <span className="text-lg font-bold text-slate-700">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div 
            className={cn(
              "mt-auto pt-10 pb-10 transition-all duration-500 transform",
              isOpen ? "opacity-100 translate-y-0 delay-500" : "opacity-0 translate-y-4"
            )}
          >
            <Link
              href="/contact"
              className="flex items-center justify-center w-full bg-gradient-to-r from-primary to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/25 active:scale-95 transition-all text-lg"
              onClick={() => setIsOpen(false)}
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
