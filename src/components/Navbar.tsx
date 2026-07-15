/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Globe, X } from "lucide-react";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect, useRef } from "react";
import { searchManga, getCoverUrl } from "@/lib/api/mangadex";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const { lang, setLang } = useLanguageStore();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus mobile input when opened
  useEffect(() => {
    if (showMobileSearch && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [showMobileSearch]);

  // Close mobile search on route change
  useEffect(() => {
    setShowMobileSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  }, [pathname]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const results = await searchManga(searchQuery);
          setSearchResults(results.slice(0, 5));
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const navLinks = [
    { href: "/", label: lang === "id" ? "Beranda" : "Home" },
    { href: "/trending", label: lang === "id" ? "Populer" : "Trending" },
    { href: "/latest", label: lang === "id" ? "Terbaru" : "Latest" },
    { href: "/genre", label: lang === "id" ? "Genre" : "Genres" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const SearchResultItem = ({ manga, onSelect }: { manga: any; onSelect: () => void }) => {
    const titleKey = manga.attributes.title ? Object.keys(manga.attributes.title)[0] : null;
    const title = titleKey ? manga.attributes.title.en || manga.attributes.title[titleKey] : "Unknown";
    const coverArt = manga.relationships?.find((r: any) => r.type === "cover_art");

    return (
      <div
        onClick={onSelect}
        className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
      >
        <img
          src={getCoverUrl(manga.id, coverArt?.attributes?.fileName) || "/cover-placeholder.svg"}
          alt={title}
          className="w-8 h-12 object-cover rounded bg-white/5 flex-shrink-0"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = "/cover-placeholder.svg"; }}
        />
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium text-white truncate">{title}</span>
          <span className="text-[10px] text-white/40 uppercase">{manga.attributes.status || "UNKNOWN"}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="text-2xl font-black tracking-tighter text-[#F27D26]">ZYNQ<span className="text-white">TOON</span></div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors pb-1 ${
                  isActive(link.href)
                    ? "text-white border-b-2 border-[#F27D26]"
                    : "hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Desktop Search */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "id" ? "Cari komik..." : "Search manga..."}
                className="bg-white/5 border border-white/10 rounded-full py-1.5 px-4 text-xs w-64 focus:outline-none focus:border-[#F27D26]/50 text-white placeholder-white/40"
              />
              {isSearching ? (
                <span className="absolute right-3 top-2 text-xs text-[#F27D26] animate-pulse">...</span>
              ) : (
                <span className="absolute right-3 top-2 opacity-30 text-xs">⌘K</span>
              )}

              {showDropdown && (
                <div className="absolute top-12 left-0 w-full bg-[#121212] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map((manga) => (
                        <SearchResultItem
                          key={manga.id}
                          manga={manga}
                          onSelect={() => {
                            setShowDropdown(false);
                            setSearchQuery("");
                            router.push(`/manga/${manga.id}`);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-white/40">
                      {isSearching
                        ? (lang === "id" ? "Mencari..." : "Searching...")
                        : (lang === "id" ? "Tidak ada hasil." : "No results found.")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              className="md:hidden text-white/60 hover:text-white transition-colors"
              aria-label="Search"
              onClick={() => setShowMobileSearch(true)}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language switcher */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <Globe className="w-4 h-4 text-white/60" />
              <button
                onClick={() => setLang("id")}
                className={`text-xs font-bold transition-colors ${lang === "id" ? "text-[#F27D26]" : "text-white/40 hover:text-white"}`}
              >
                ID
              </button>
              <span className="text-white/20 text-xs">/</span>
              <button
                onClick={() => setLang("en")}
                className={`text-xs font-bold transition-colors ${lang === "en" ? "text-[#F27D26]" : "text-white/40 hover:text-white"}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col md:hidden">
          <div className="bg-[#0A0A0A] border-b border-white/10 p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "id" ? "Cari komik..." : "Search manga..."}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-[#F27D26]/50 text-white placeholder-white/40"
              />
              {isSearching && (
                <span className="absolute right-4 top-3 text-xs text-[#F27D26] animate-pulse">...</span>
              )}
            </div>
            <button
              onClick={() => { setShowMobileSearch(false); setSearchQuery(""); setSearchResults([]); }}
              className="p-2 text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
            {searchQuery.length >= 3 && (
              searchResults.length > 0 ? (
                <div>
                  {searchResults.map((manga) => (
                    <SearchResultItem
                      key={manga.id}
                      manga={manga}
                      onSelect={() => {
                        setShowMobileSearch(false);
                        setSearchQuery("");
                        router.push(`/manga/${manga.id}`);
                      }}
                    />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-8 text-center text-sm text-white/40">
                  {lang === "id" ? "Tidak ada hasil ditemukan." : "No results found."}
                </div>
              ) : null
            )}
            {searchQuery.length < 3 && searchQuery.length > 0 && (
              <div className="p-8 text-center text-sm text-white/40">
                {lang === "id" ? "Ketik minimal 3 karakter..." : "Type at least 3 characters..."}
              </div>
            )}
            {searchQuery.length === 0 && (
              <div className="p-8 text-center text-sm text-white/40">
                {lang === "id" ? "Mulai ketik untuk mencari..." : "Start typing to search..."}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
