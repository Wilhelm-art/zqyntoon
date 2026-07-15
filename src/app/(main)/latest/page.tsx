"use client";
import { getMangaList, getCoverUrlWithFallback, getMangaTitle } from "@/lib/api/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect } from "react";

export default function Latest() {
  const { lang } = useLanguageStore();
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const loadData = async (currentOffset: number, append = false) => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);
      const rawLatest = await getMangaList({ limit: LIMIT, offset: currentOffset, includes: ['cover_art', 'author'] });
      if (!rawLatest || rawLatest.length < LIMIT) setHasMore(false);
      
      const mapData = (mdData: any) => {
        if (!mdData || !Array.isArray(mdData)) return [];
        return mdData.map((m: any) => {
          const coverArt = m.relationships.find((r: any) => r.type === 'cover_art');
          const author = m.relationships.find((r: any) => r.type === 'author');
          
          const title = getMangaTitle(m);

          const genres = m.attributes.tags
            ?.filter((t: any) => t.attributes?.group === 'genre' || t.attributes?.group === 'theme')
            .map((t: any) => t.attributes?.name?.en || Object.values(t.attributes?.name || {})[0])
            .slice(0, 3) || [];
            
          const coverUrl = getCoverUrlWithFallback(m.id, coverArt?.attributes?.fileName);
            
          return {
            id: m.id,
            title,
            slug: m.id, 
            cover_url: coverUrl,
            author: author?.attributes?.name || 'Unknown Author', 
            rating: null,
            status: m.attributes?.status?.toUpperCase() || 'UNKNOWN',
            genres,
            synopsis: ''
          };
        });
      };

      const newData = mapData(rawLatest);
      setMangaList(prev => append ? [...prev, ...newData] : newData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
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
          {lang === 'id' ? 'Pembaruan Terbaru' : 'Latest Updates'}
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[3/4] rounded-lg bg-[#1a1a1a] animate-pulse" />
              <div className="h-4 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {mangaList.map((manga: any, index: number) => (
              <MangaCard key={`${manga.id}-${index}`} manga={manga} lang={lang} />
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors border border-white/10 flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />{lang === 'id' ? 'Memuat...' : 'Loading...'}</>
                ) : (
                  lang === 'id' ? 'Muat Lebih Banyak' : 'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
