"use client";
import { getMangaByTag, GENRE_TAG_MAP, getCoverUrlWithFallback, getMangaTitle } from "@/lib/api/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect, use } from "react";

export default function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLanguageStore();
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const displayGenre = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const tagId = GENRE_TAG_MAP[slug];

  const loadData = async (currentOffset: number, append = false) => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      let rawManga: any[];

      if (tagId) {
        // Real genre filter using MangaDex tag UUID
        rawManga = await getMangaByTag({ tagId, limit: LIMIT, offset: currentOffset });
      } else {
        // Fallback: search by genre name as title (approximate)
        const { searchManga } = await import("@/lib/api/mangadex");
        rawManga = await searchManga(displayGenre);
      }

      if (!rawManga || rawManga.length < LIMIT) setHasMore(false);

      const mapData = (mdData: any[]) => {
        if (!mdData || !Array.isArray(mdData)) return [];
        return mdData.map((m: any) => {
          const coverArt = m.relationships?.find((r: any) => r.type === 'cover_art');
          const author = m.relationships?.find((r: any) => r.type === 'author');

          const title = getMangaTitle(m);

          const genres = m.attributes?.tags
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
            synopsis: '',
          };
        });
      };

      const newData = mapData(rawManga ?? []);
      setMangaList(prev => append ? [...prev, ...newData] : newData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setMangaList([]);
    setOffset(0);
    setHasMore(true);
    loadData(0);
  }, [slug]);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    loadData(nextOffset, true);
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
        <div>
          <span className="text-[#F27D26] text-xs font-bold tracking-wider uppercase mb-2 block">
            {lang === 'id' ? 'Kategori Genre' : 'Genre Category'}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight text-white">
            {displayGenre}
          </h1>
          {!tagId && (
            <p className="text-xs text-white/30 mt-2">
              {lang === 'id' ? '(Genre tidak dikenali, menampilkan hasil pencarian)' : '(Unknown genre, showing search results)'}
            </p>
          )}
        </div>
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
      ) : mangaList.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh] text-white/40 text-center flex-col gap-3">
          <span className="text-4xl">📚</span>
          <p>{lang === 'id' ? 'Tidak ada manga ditemukan untuk genre ini.' : 'No manga found for this genre.'}</p>
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
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    {lang === 'id' ? 'Memuat...' : 'Loading...'}
                  </>
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
