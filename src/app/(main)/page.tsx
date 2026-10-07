/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { MangaCard } from "@/components/MangaCard";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect } from "react";
import { getHomepageData } from "@/lib/api/unifiedManga";

export default function Home() {
  const { lang } = useLanguageStore();
  const [heroManga, setHeroManga] = useState<any>(null);
  const [trendingManga, setTrendingManga] = useState<any[]>([]);
  const [latestManga, setLatestManga] = useState<any[]>([]);
  const [manhwaManga, setManhwaManga] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getHomepageData();
      
      if (data.hero && data.hero.length > 0) {
        setHeroManga(data.hero[0]);
      }
      setTrendingManga(data.trending || []);
      setLatestManga(data.latest || []);
      setManhwaManga(data.idRecommended || []);
    } catch (error) {
      console.error("Failed to load Indonesian manga:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[21/7] bg-[#121212] animate-pulse" />
        </div>
        {[0, 1].map((s) => (
          <div key={s} className="mb-12">
            <div className="h-6 w-40 bg-white/5 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="aspect-[3/4] rounded-xl bg-[#1a1a1a] animate-pulse" />
                  <div className="h-4 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      {heroManga && (
        <section className="mb-12">
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[21/7] bg-[#111115] border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
            <img 
              src={heroManga.cover_url || heroManga.coverUrl || "/cover-placeholder.svg"} 
              alt={heroManga.title} 
              className="absolute right-0 top-0 w-full md:w-3/5 h-full object-cover opacity-40 blur-xs"
            />
            <div className="relative z-20 h-full flex flex-col justify-center p-6 md:p-12 w-full md:w-2/3 space-y-3">
              <div className="flex gap-2 mb-2">
                <span className="bg-[#F27D26] text-black text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {lang === 'id' ? 'POPULER #1' : 'TRENDING #1'}
                </span>
                {heroManga.genres && heroManga.genres[0] && (
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                    {heroManga.genres[0]}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white line-clamp-1">
                {heroManga.title}
              </h1>
              <p className="text-sm text-white/60 line-clamp-2 italic mb-4 max-w-xl">
                {heroManga.synopsis}
              </p>
              <div className="flex gap-4 pt-2">
                <Link 
                  href={`/manga/${heroManga.slug || heroManga.id}`} 
                  className="bg-[#F27D26] hover:bg-[#ff9d5c] text-black px-8 py-3 rounded-md font-bold text-sm transition-colors shadow-lg"
                >
                  {lang === 'id' ? 'MULAI BACA' : 'START READING'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Comics Shelf */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {lang === 'id' ? 'Komik Sedang Populer' : 'Trending Now'}
            </h2>
            <p className="text-xs text-white/40 mt-1 font-mono">Pilihan pembaca komik Indonesia minggu ini</p>
          </div>
          <Link href="/trending" className="text-[#F27D26] text-xs font-semibold hover:text-white transition-colors">
            {lang === 'id' ? 'LIHAT SEMUA' : 'VIEW ALL'}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {trendingManga.slice(0, 12).map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
          ))}
        </div>
      </section>

      {/* Latest Comics Shelf */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {lang === 'id' ? 'Chapter Terbaru Bahasa Indonesia' : 'Latest Chapter Updates'}
            </h2>
            <p className="text-xs text-white/40 mt-1 font-mono">Update chapter komik terbaru hari ini</p>
          </div>
          <Link href="/latest" className="text-[#F27D26] text-xs font-semibold hover:text-white transition-colors">
            {lang === 'id' ? 'LIHAT SEMUA' : 'VIEW ALL'}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {latestManga.slice(0, 12).map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
          ))}
        </div>
      </section>

      {/* Manhwa Recommendations */}
      {manhwaManga.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Rekomendasi Manhwa & Webtoon
              </h2>
              <p className="text-xs text-white/40 mt-1 font-mono">Serial berwarna terbaik terjemahan Indonesia</p>
            </div>
            <Link href="/trending" className="text-[#F27D26] text-xs font-semibold hover:text-white transition-colors">
              LIHAT SEMUA
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {manhwaManga.slice(0, 12).map((manga: any) => (
              <MangaCard key={manga.id} manga={manga} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Genre Exploration */}
      <section className="pt-4 border-t border-white/5">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-lg font-bold tracking-tight text-white">Jelajahi Genre Komik</h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {["Action", "Adventure", "Fantasy", "Manhwa", "Manhua", "Martial Arts", "Romance", "Comedy", "Isekai", "Supernatural", "Mystery"].map(genre => (
            <Link 
              href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`} 
              key={genre} 
              className="px-4 py-2 rounded-full bg-white/5 text-white/70 text-xs font-medium hover:bg-[#F27D26] hover:text-black transition-all border border-white/5"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
