/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { MangaCard } from "@/components/MangaCard";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect } from "react";
import { getLatestComics } from "@/lib/scraper/bacakomik";
import { Clock } from "lucide-react";

export default function Latest() {
  const { lang } = useLanguageStore();
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getLatestComics();
        setMangaList(data);
      } catch (error) {
        console.error("Failed to load latest comics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic font-light tracking-tight text-white flex items-center gap-2">
          <Clock className="w-7 h-7 text-[#F27D26]" />
          Pembaruan Terbaru
        </h1>
        <p className="text-xs text-white/40 mt-1 font-mono">
          Chapter komik terjemahan bahasa Indonesia yang baru saja dirilis
        </p>
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
