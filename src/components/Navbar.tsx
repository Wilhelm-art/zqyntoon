"use client";
import { Search, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar({ lang = "id" }: { lang?: string }) {
  const pathname = usePathname();
  
  const switchLangUrl = (targetLang: string) => {
    if (!pathname) return `/${targetLang}`;
    // Replace the first segment (/id or /en) with targetLang
    return pathname.replace(/^\/(id|en)/, `/${targetLang}`);
  };
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-2 text-white">
          <div className="text-2xl font-black tracking-tighter text-[#F27D26]">ZYNQ<span className="text-white">TOON</span></div>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
          <Link href={`/${lang}`} className="text-white border-b-2 border-[#F27D26] pb-1">Home</Link>
          <Link href={`/${lang}`} className="hover:text-white transition-colors">Trending</Link>
          <Link href={`/${lang}`} className="hover:text-white transition-colors">Latest</Link>
          <Link href={`/${lang}`} className="hover:text-white transition-colors">Genres</Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <input type="text" placeholder="Search manga..." className="bg-white/5 border border-white/10 rounded-full py-1.5 px-4 text-xs w-64 focus:outline-none focus:border-[#F27D26]/50 text-white placeholder-white/40" />
            <span className="absolute right-3 top-2 opacity-30 text-xs">⌘K</span>
          </div>
          <button className="md:hidden text-white/60 hover:text-white transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <Globe className="w-4 h-4 text-white/60" />
            <Link 
              href={switchLangUrl("id")} 
              className={`text-xs font-bold transition-colors ${lang === 'id' ? 'text-[#F27D26]' : 'text-white/40 hover:text-white'}`}
            >
              ID
            </Link>
            <span className="text-white/20 text-xs">/</span>
            <Link 
              href={switchLangUrl("en")} 
              className={`text-xs font-bold transition-colors ${lang === 'en' ? 'text-[#F27D26]' : 'text-white/40 hover:text-white'}`}
            >
              EN
            </Link>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#F27D26] to-[#ff9d5c] flex items-center justify-center text-xs font-bold text-black cursor-pointer ml-2">
            JD
          </div>
        </div>
      </div>
    </nav>
  );
}