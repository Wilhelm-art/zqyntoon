"use client";
import { getMangaList, getCoverUrlWithFallback } from "@/lib/api/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect } from "react";

export default function Trending() {
  const { lang } = useLanguageStore();
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const loadData = async (currentOffset: number, append = false) => {
    try {
      if (!append) setIsLoading(true);
      const rawTrending = await getMangaList({ limit: LIMIT, offset: currentOffset, includes: ['cover_art', 'author'] });
      
      const mapData = async (mdData: any) => {
        if (!mdData || !Array.isArray(mdData)) return [];
        return Promise.all(mdData.map(async (m: any) => {
          const coverArt = m.relationships.find((r: any) => r.type === 'cover_art');
          const author = m.relationships.find((r: any) => r.type === 'author');
          
          let title = 'Unknown Title';
          if (m.attributes.title) {
              title = m.attributes.title.en || m.attributes.title.id || Object.values(m.attributes.title)[0] || title;
          }
            
          const coverUrl = await getCoverUrlWithFallback(m.id, coverArt?.attributes?.fileName, title as string);
            
          return {
            id: m.id,
            title,
            slug: m.id, 
            cover_url: coverUrl,
            author: author?.attributes?.name || 'Unknown Author', 
            rating: null,
            status: m.attributes?.status?.toUpperCase() || 'UNKNOWN',
            genres: [],
            synopsis: ''
          };
        }));
      };

      const newData = await mapData(rawTrending);
      setMangaList(prev => append ? [...prev, ...newData] : newData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(0);
  }, []);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    loadData(nextOffset, true);
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl md:text-4xl font-serif italic font-light tracking-tight text-white">
          {lang === 'id' ? 'Sedang Populer' : 'Trending Now'}
        </h1>
      </div>

      {isLoading && mangaList.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh] text-white/50">
          {lang === 'id' ? 'Memuat data manga...' : 'Loading manga data...'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {mangaList.map((manga: any, index: number) => (
              <MangaCard key={`${manga.id}-${index}`} manga={manga} lang={lang} />
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
             <button 
                onClick={handleLoadMore}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors border border-white/10"
             >
                {lang === 'id' ? 'Muat Lebih Banyak' : 'Load More'}
             </button>
          </div>
        </>
      )}
    </main>
  );
}
