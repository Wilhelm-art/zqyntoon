/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { MangaCard } from "@/components/MangaCard";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect } from "react";
import { getPopularComics, getManhwaComics } from "@/lib/scraper/bacakomik";
import { Flame, Sparkles } from "lucide-react";

export default function Trending() {
  const { lang } = useLanguageStore();
  const [tab, setTab] = useState<'popular' | 'manhwa'>('popular');
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (tab === 'popular') {
          const data = await getPopularComics();
          setMangaList(data);
        } else {
          const data = await getManhwaComics();
          setMangaList(data);
        }
      } catch (error) {
        console.error("Failed to load trending comics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tab]);

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif italic font-light tracking-tight text-white flex items-center gap-2">
            <Flame className="w-7 h-7 text-[#F27D26]" />
            Komik Terpopuler
          </h1>
          <p className="text-xs text-white/40 mt-1 font-mono">Daftar judul paling banyak dibaca pembaca Indonesia</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-[#121215] border border-white/10 p-1 rounded-xl self-start">
          <button
            onClick={() => setTab('popular')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'popular'
                ? 'bg-[#F27D26] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Semua Komik
          </button>
          <button
            onClick={() => setTab('manhwa')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'manhwa'
                ? 'bg-[#F27D26] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Khusus Manhwa
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[3/4] rounded-xl bg-[#111115] animate-pulse" />
              <div className="h-4 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {mangaList.map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
          ))}
        </div>
      )}
    </main>
  );
}
