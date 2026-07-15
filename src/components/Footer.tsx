"use client";
import { useLanguageStore } from "@/store/languageStore";

export function Footer() {
  const { lang } = useLanguageStore();

  return (
    <footer className="w-full border-t border-white/10 bg-[#0A0A0A] mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-2xl font-black tracking-tighter text-[#F27D26]">ZYNQ<span className="text-white">TOON</span></div>
        
        <div className="flex items-center gap-6 text-[9px] text-white/30 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">{lang === 'id' ? 'Tentang' : 'About'}</a>
          <a href="#" className="hover:text-white transition-colors">DMCA</a>
          <a href="#" className="hover:text-white transition-colors">{lang === 'id' ? 'Ketentuan' : 'Terms'}</a>
          <a href="#" className="hover:text-white transition-colors">{lang === 'id' ? 'Privasi' : 'Privacy'}</a>
        </div>
        
        <p className="text-[10px] text-white/20">
          &copy; {new Date().getFullYear()} ZYNQTOON ENTERTAINMENT
        </p>
      </div>
    </footer>
  );
}