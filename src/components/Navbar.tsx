"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bookmark, History, Flame, Clock, Compass, Menu, X } from "lucide-react";
import { SearchModal } from "@/components/SearchModal";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useSearchStore } from "@/store/searchStore";

export function Navbar() {
  const pathname = usePathname();
  const { isOpen: searchOpen, openSearch, closeSearch } = useSearchStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bookmarks = useBookmarkStore((state) => state.bookmarks);

  const navLinks = [
    { href: "/", label: "Beranda", icon: Compass },
    { href: "/trending", label: "Populer", icon: Flame },
    { href: "/latest", label: "Terbaru", icon: Clock },
    {
      href: "/bookmarks",
      label: "Bookmark",
      icon: Bookmark,
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
    },
    { href: "/history", label: "Riwayat", icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#07080B]/90 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F27D26] to-[#FFA24D] flex items-center justify-center shadow-[0_0_15px_rgba(242,125,38,0.4)] group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-black text-lg">Z</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-white flex items-center">
                ZQYN<span className="text-[#F27D26]">TOON</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold -mt-1">
                Komik Indonesia
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-[#F27D26] bg-[#F27D26]/10 font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-[#F27D26] text-black font-bold rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search CTA & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={openSearch}
              className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0F1117] border border-white/10 hover:border-[#F27D26]/40 text-gray-400 hover:text-gray-200 text-sm transition-all shadow-inner"
            >
              <Search className="w-4 h-4 text-[#F27D26]" />
              <span className="hidden sm:inline text-xs font-normal">Cari komik...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/5 bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "text-[#F27D26] bg-[#F27D26]/10 font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[10px] bg-[#F27D26] text-black font-bold rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Interactive Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={closeSearch} />
    </>
  );
}
