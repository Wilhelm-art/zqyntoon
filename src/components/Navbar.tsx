/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Globe } from "lucide-react";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect, useRef } from "react";
import { searchManga, getCoverUrl } from "@/lib/api/mangadex";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { lang, setLang } = useLanguageStore();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const results = await searchManga(searchQuery);
          setSearchResults(results.slice(0, 5)); // Show top 5
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="text-2xl font-black tracking-tighter text-[#F27D26]">ZYNQ<span className="text-white">TOON</span></div>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
          <Link href="/" className="text-white border-b-2 border-[#F27D26] pb-1">
            {lang === 'id' ? 'Beranda' : 'Home'}
          </Link>
          <a className="hover:text-white transition-colors opacity-50 cursor-not-allowed pointer-events-none">
            {lang === 'id' ? 'Populer' : 'Trending'}
          </a>
          <a className="hover:text-white transition-colors opacity-50 cursor-not-allowed pointer-events-none">
            {lang === 'id' ? 'Terbaru' : 'Latest'}
          </a>
          <a className="hover:text-white transition-colors opacity-50 cursor-not-allowed pointer-events-none">
            {lang === 'id' ? 'Genre' : 'Genres'}
          </a>
        </div>

        <div className="flex items-center gap-6 relative">
          <div className="relative hidden md:block" ref={dropdownRef}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'id' ? "Cari komik..." : "Search manga..."} 
              className="bg-white/5 border border-white/10 rounded-full py-1.5 px-4 text-xs w-64 focus:outline-none focus:border-[#F27D26]/50 text-white placeholder-white/40" 
            />
            {isSearching ? (
              <span className="absolute right-3 top-2 text-xs text-[#F27D26] animate-pulse">...</span>
            ) : (
              <span className="absolute right-3 top-2 opacity-30 text-xs">⌘K</span>
            )}

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-12 left-0 w-full bg-[#121212] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <div className="flex flex-col">
                    {searchResults.map((manga) => {
                      const titleKey = manga.attributes.title ? Object.keys(manga.attributes.title)[0] : null;
                      const title = titleKey ? manga.attributes.title.en || manga.attributes.title[titleKey] : 'Unknown';
                      const coverArt = manga.relationships?.find((r: any) => r.type === 'cover_art');
                      
                      return (
                        <div 
                          key={manga.id}
                          onClick={() => {
                            setShowDropdown(false);
                            setSearchQuery("");
                            router.push(`/manga/${manga.id}`);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                        >
                          <img 
                            src={getCoverUrl(manga.id, coverArt?.attributes?.fileName)} 
                            alt={title}
                            className="w-8 h-12 object-cover rounded bg-white/5"
                            loading="lazy"
                          />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-white truncate">{title}</span>
                            <span className="text-[10px] text-white/40 uppercase">{manga.attributes.status || 'UNKNOWN'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                   <div className="p-4 text-center text-sm text-white/40">
                     {lang === 'id' ? 'Tidak ada hasil.' : 'No results found.'}
                   </div>
                )}
              </div>
            )}
          </div>
          <button className="md:hidden text-white/60 hover:text-white transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <Globe className="w-4 h-4 text-white/60" />
            <button 
              onClick={() => setLang("id")}
              className={`text-xs font-bold transition-colors ${lang === 'id' ? 'text-[#F27D26]' : 'text-white/40 hover:text-white'}`}
            >
              ID
            </button>
            <span className="text-white/20 text-xs">/</span>
            <button 
              onClick={() => setLang("en")}
              className={`text-xs font-bold transition-colors ${lang === 'en' ? 'text-[#F27D26]' : 'text-white/40 hover:text-white'}`}
            >
              EN
            </button>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#F27D26] to-[#ff9d5c] flex items-center justify-center text-xs font-bold text-black cursor-pointer ml-2">
            JD
          </div>
        </div>
      </div>
    </nav>
  );
}
