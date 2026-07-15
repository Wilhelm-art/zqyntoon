/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { getMangaList, getCoverUrlWithFallback } from "@/lib/api/mangadex";
import { MangaCard } from "@/components/MangaCard";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect } from "react";

export default function Home() {
  const { lang } = useLanguageStore();
  const [trendingManga, setTrendingManga] = useState<any[]>([]);
  const [latestManga, setLatestManga] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const rawTrending = await getMangaList({ limit: 10, offset: 0, includes: ['cover_art', 'author'] });
      const rawLatest = await getMangaList({ limit: 10, offset: 20, includes: ['cover_art', 'author'] });
      
      const mapData = async (mdData: any) => {
        if (!mdData || !Array.isArray(mdData)) return [];
        return Promise.all(mdData.map(async (m: any) => {
          const coverArt = m.relationships.find((r: any) => r.type === 'cover_art');
          const author = m.relationships.find((r: any) => r.type === 'author');
          
          let title = 'Unknown Title';
          if (m.attributes.title) {
              title = m.attributes.title.en || m.attributes.title.id || Object.values(m.attributes.title)[0] || title;
          }
          
          let description = 'No synopsis available.';
          if (m.attributes.description && typeof m.attributes.description === 'object') {
              description = m.attributes.description.en || m.attributes.description.id || Object.values(m.attributes.description)[0] || description;
          }
          
          const genres = m.attributes.tags
            .filter((t: any) => t.attributes.group === 'genre' || t.attributes.group === 'theme')
            .map((t: any) => t.attributes.name.en || Object.values(t.attributes.name)[0])
            .slice(0, 3);
            
          const coverUrl = await getCoverUrlWithFallback(m.id, coverArt?.attributes?.fileName, title as string);
            
          return {
            id: m.id,
            title,
            slug: m.id, 
            cover_url: coverUrl,
            author: author?.attributes?.name || 'Unknown Author', 
            rating: null,
            status: m.attributes?.status?.toUpperCase() || 'UNKNOWN',
            genres: genres.length > 0 ? genres : ['Manga'],
            synopsis: description
          };
        }));
      };

      setTrendingManga(await mapData(rawTrending));
      setLatestManga(await mapData(rawLatest));
    } catch (error) {
      console.error("Failed to load manga:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const heroManga = trendingManga.length > 0 ? trendingManga[0] : null;

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[50vh] text-white/50">{lang === 'id' ? 'Memuat data manga...' : 'Loading manga data...'}</div>;
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      {heroManga && (
        <section className="mb-12">
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[21/7] bg-[#121212]">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
            <img 
              src={heroManga.cover_url} 
              alt="Hero Banner" 
              className="absolute right-0 top-0 w-2/3 h-full object-cover opacity-50"
            />
            <div className="relative z-20 h-full flex flex-col justify-center p-6 md:p-10 w-full md:w-2/3 space-y-3">
              <div className="flex gap-2 mb-2">
                <span className="bg-[#F27D26] text-black text-[10px] font-bold px-2 py-0.5 rounded">
                  {lang === 'id' ? 'POPULER #1' : 'TRENDING #1'}
                </span>
                {heroManga.genres[0] && (
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {heroManga.genres[0]}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white line-clamp-1">
                {heroManga.title}
              </h1>
              <p className="text-sm text-white/60 line-clamp-2 italic mb-4">
                {heroManga.synopsis}
              </p>
              <div className="flex gap-4 pt-2">
                <Link href={`/manga/${heroManga.slug}`} className="bg-white text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-zinc-200 transition-colors">
                  {lang === 'id' ? 'MULAI BACA' : 'START READING'}
                </Link>
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors opacity-50 cursor-not-allowed pointer-events-none">
                  + {lang === 'id' ? 'SIMPAN' : 'WISHLIST'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">{lang === 'id' ? 'Sedang Populer' : 'Trending Now'}</h2>
          <a className="text-[#F27D26] text-xs font-semibold opacity-50 cursor-not-allowed pointer-events-none">{lang === 'id' ? 'LIHAT SEMUA' : 'VIEW ALL'}</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {trendingManga.map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">{lang === 'id' ? 'Pembaruan Terbaru' : 'Latest Updates'}</h2>
          <a className="text-[#F27D26] text-xs font-semibold opacity-50 cursor-not-allowed pointer-events-none">{lang === 'id' ? 'LIHAT SEMUA' : 'VIEW ALL'}</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {latestManga.map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">{lang === 'id' ? 'Jelajahi Genre' : 'Browse Genres'}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {["Action", "Romance", "Fantasy", "Sci-Fi", "Horror", "Comedy", "Slice of Life", "Mystery", "Drama", "Supernatural"].map(genre => (
            <button key={genre} className="px-4 py-2 rounded-full bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors opacity-50 cursor-not-allowed pointer-events-none">
              {genre}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
