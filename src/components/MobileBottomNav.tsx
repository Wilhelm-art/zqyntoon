"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Flame, Bookmark, History, Search } from "lucide-react";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useSearchStore } from "@/store/searchStore";

export function MobileBottomNav() {
  const pathname = usePathname();
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const openSearch = useSearchStore((state) => state.openSearch);

  // Hide bottom bar when inside chapter reader to avoid double docks
  const isReadingChapter = /^\/manga\/[^\/]+\/[^\/]+/.test(pathname);
  if (isReadingChapter) return null;

  const navItems = [
    { href: "/", label: "Beranda", icon: Compass },
    { href: "/trending", label: "Populer", icon: Flame },
    { action: "search", label: "Cari", icon: Search },
    {
      href: "/bookmarks",
      label: "Bookmark",
      icon: Bookmark,
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
    },
    { href: "/history", label: "Riwayat", icon: History },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080B]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] transition-all duration-200"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.action === "search") {
            return (
              <button
                key="search-btn"
                onClick={openSearch}
                className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-400 hover:text-white transition-colors active:scale-95"
                aria-label="Cari Komik"
              >
                <div className="p-1 rounded-lg">
                  <Icon className="w-5 h-5 text-[#F27D26]" />
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative active:scale-95 ${
                isActive
                  ? "text-[#F27D26] font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="relative p-1">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 text-[#F27D26]" : ""
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-0.5 -right-1 px-1.5 py-0.2 text-[9px] font-bold bg-[#F27D26] text-black rounded-full shadow-sm leading-tight min-w-[16px] text-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
