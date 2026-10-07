/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { getMangaDetails, getMangaChapters, getCoverUrlWithFallback, getMangaTitle } from "@/lib/api/mangadex";
import { ChevronRight, Globe, BookX, Bookmark, BookmarkCheck } from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useHistoryStore } from "@/store/historyStore";
import { useState, useEffect, use } from "react";

export default function Series({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLanguageStore();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const { getHistory } = useHistoryStore();

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterLang, setChapterLang] = useState<'en' | 'id'>('id');
  const [usingFallbackLang, setUsingFallbackLang] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allChapters, setAllChapters] = useState<{ en: any[]; id: any[] }>({ en: [], id: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const decodedSlug = decodeURIComponent(slug);
        const isBacakomik = 
          decodedSlug.startsWith('bk-') || 
          decodedSlug.startsWith('bk:') || 
          decodedSlug.startsWith('id-scraper') || 
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);

        // 1. Direct Indonesian Comic Fetch (Bacakomik)
        if (isBacakomik) {
          try {
            const detailRes = await fetch(`/api/id-scraper/detail?slug=${encodeURIComponent(decodedSlug)}`);
            if (detailRes.ok) {
              const bkDetail = await detailRes.json();

              setManga({
                id: bkDetail.id,
                title: bkDetail.title,
                slug: bkDetail.slug,
                cover_url: bkDetail.coverUrl,
                author: bkDetail.author,
                status: bkDetail.status,
                genres: bkDetail.genres,
                synopsis: bkDetail.synopsis,
                source: 'bacakomik',
              });

              const idChapters = (bkDetail.chapters || []).map((ch: any) => ({
                id: ch.id,
                chapter_number: ch.chapter_number,
                title: ch.title,
                published_at: new Date().toISOString(),
                scanlator: 'Komik Indo',
                externalUrl: null,
                isScraper: true,
              }));

              setChapters(idChapters);
              setAllChapters({ en: [], id: idChapters });
              setChapterLang('id');
              setUsingFallbackLang(false);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.warn('ID Scraper fetch failed, attempting MangaDex fallback:', e);
          }
        }

        // 2. MangaDex with Automatic Indonesian Scraper Fallback
        const [mangaData, rawChapters] = await Promise.all([
          getMangaDetails(slug),
          getMangaChapters(slug, lang === 'id' ? ['id', 'en'] : ['en', 'id'])
        ]);

        const coverArt = mangaData.relationships?.find((r: any) => r.type === 'cover_art');
        const author = mangaData.relationships?.find((r: any) => r.type === 'author');
        const title = getMangaTitle(mangaData);

        let description = 'Sinopsis komik belum tersedia.';
        if (mangaData.attributes?.description && typeof mangaData.attributes.description === 'object') {
            description = mangaData.attributes.description.id || mangaData.attributes.description.en || Object.values(mangaData.attributes.description)[0] as string || description;
        }

        let finalChapters = rawChapters.map((ch: any) => {
          const group = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
          return {
            id: ch.id,
            chapter_number: ch.attributes?.chapter || 'Oneshot',
            title: ch.attributes?.title || null,
            published_at: ch.attributes?.readableAt || ch.attributes?.publishAt,
            scanlator: group?.attributes?.name || 'Official',
            externalUrl: null,
          };
        });

        // Search in ID Scraper to provide Indonesian chapters
        if (title && title !== "Unknown") {
          try {
            const searchRes = await fetch(`/api/id-scraper/search?title=${encodeURIComponent(title)}`);
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.results && searchData.results.length > 0) {
                const match = searchData.results[0];
                const chaptersRes = await fetch(`/api/id-scraper/chapters?endpoint=${encodeURIComponent(match.endpoint)}`);
                if (chaptersRes.ok) {
                  const chaptersData = await chaptersRes.json();
                  if (chaptersData.chapters && chaptersData.chapters.length > 0) {
                    finalChapters = chaptersData.chapters.map((ch: any) => ({
                      ...ch,
                      isScraper: true,
                    }));
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed to fetch from ID scraper', e);
          }
        }

        const genres = (mangaData.attributes?.tags ?? [])
          .filter((t: any) => t.attributes?.group === 'genre' || t.attributes?.group === 'theme')
          .map((t: any) => t.attributes?.name?.en || Object.values(t.attributes?.name ?? {})[0])
          .slice(0, 4);

        const coverUrl = getCoverUrlWithFallback(mangaData.id, coverArt?.attributes?.fileName);

        setManga({
          id: mangaData.id,
          title,
          slug: mangaData.id,
          cover_url: coverUrl,
          author: author?.attributes?.name || 'Unknown Author',
          rating: null,
          status: mangaData.attributes?.status?.toUpperCase() || 'UNKNOWN',
          genres: genres.length > 0 ? genres : ['Manga'],
          synopsis: description,
        });

        let idChapters: any[] = [];
        let enChapters: any[] = [];

        const isIdScraper = finalChapters.length > 0 && (
          finalChapters[0].isScraper || 
          finalChapters[0].id?.startsWith('bk-') || 
          finalChapters[0].id?.startsWith('bk:')
        );

        if (isIdScraper) {
          idChapters = finalChapters;
          enChapters = rawChapters
            .filter((ch: any) => ch.attributes?.translatedLanguage === 'en')
            .map((ch: any) => ({
              id: ch.id,
              chapter_number: ch.attributes?.chapter || 'Oneshot',
              title: ch.attributes?.title || null,
              published_at: ch.attributes?.readableAt || ch.attributes?.publishAt,
              scanlator: 'English Scan',
              externalUrl: null,
            }));
        } else {
          idChapters = finalChapters.filter((ch: any) => {
            const rawMatch = rawChapters.find((r: any) => r.id === ch.id);
            return rawMatch && rawMatch.attributes?.translatedLanguage === 'id';
          });
          enChapters = finalChapters.filter((ch: any) => {
            const rawMatch = rawChapters.find((r: any) => r.id === ch.id);
            return rawMatch && rawMatch.attributes?.translatedLanguage === 'en';
          });
        }

        const sortDesc = (a: any, b: any) => {
          const numA = parseFloat(a.chapter_number) || 0;
          const numB = parseFloat(b.chapter_number) || 0;
          return numB - numA;
        };

        idChapters.sort(sortDesc);
        enChapters.sort(sortDesc);

        setAllChapters({ en: enChapters, id: idChapters });

        if (idChapters.length > 0) {
          setChapterLang('id');
          setChapters(idChapters);
          setUsingFallbackLang(false);
        } else if (enChapters.length > 0) {
          setChapterLang('en');
          setChapters(enChapters);
          setUsingFallbackLang(true);
        } else {
          setChapters([]);
          setUsingFallbackLang(false);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug, lang]);

  const switchChapterLang = (newLang: 'en' | 'id') => {
    const list = allChapters[newLang];
    if (list.length > 0) {
      setChapterLang(newLang);
      setChapters(list);
      setUsingFallbackLang(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1">
        <section className="relative">
          <div className="h-[40vh] md:h-[50vh] w-full bg-[#121212] animate-pulse" />
          <div className="container mx-auto px-4 relative z-30 -mt-32 md:-mt-48 flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0 aspect-[2/3] rounded-lg bg-[#1a1a1a] animate-pulse" />
            <div className="flex flex-col justify-end pb-4 space-y-4 flex-1">
              <div className="h-10 bg-white/5 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-12 w-48 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 py-12">
          <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (!manga) {
    return (
      <div className="text-center py-24 text-zinc-400 flex flex-col items-center gap-4">
        <BookX className="w-12 h-12 text-[#F27D26]" />
        <p className="text-lg text-white font-medium">Komik tidak ditemukan</p>
        <Link href="/" className="bg-[#F27D26] text-black font-bold px-6 py-2.5 rounded-lg text-sm">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zynqtoon.vercel.app';
  const firstChapterId = chapters.length > 0 ? chapters[chapters.length - 1].id : null;
  const hasEnChapters = allChapters.en.length > 0;
  const hasIdChapters = allChapters.id.length > 0;

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 h-[40vh] md:h-[50vh] w-full overflow-hidden">
          <img
            src={manga.cover_url || "/cover-placeholder.svg"}
            alt={manga.title}
            className="w-full h-full object-cover blur-2xl opacity-20 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-30 pt-16 md:pt-24 flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#111115]">
            <img
              src={manga.cover_url || "/cover-placeholder.svg"}
              alt={manga.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/cover-placeholder.svg";
              }}
            />
          </div>

          <div className="flex flex-col justify-end pb-4 space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white">
              {manga.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
              <span className="text-white/80">{manga.author}</span>
              <span className="text-white/40">•</span>
              <span className={manga.status?.toUpperCase() === 'ONGOING' ? 'text-green-400' : 'text-blue-400'}>
                {manga.status}
              </span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {(manga.genres || []).map((genre: string) => (
                <span key={genre} className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link 
                href={getHistory(manga.id) ? `/manga/${manga.slug}/chapter-${getHistory(manga.id)?.chapterId}` : (firstChapterId ? `/manga/${manga.slug}/chapter-${firstChapterId}` : '#')}
                className={`text-center px-8 py-3 rounded-md font-bold text-sm transition-colors ${(firstChapterId || getHistory(manga.id)) ? 'bg-[#F27D26] hover:bg-[#ff9d5c] text-black' : 'bg-white/10 text-white/40 cursor-not-allowed pointer-events-none'}`}
              >
                {getHistory(manga.id) 
                  ? `LANJUTKAN CH. ${getHistory(manga.id)?.chapterNumber}`
                  : 'BACA CHAPTER PERTAMA'}
              </Link>
          
              <button 
                onClick={() => {
                  if (isBookmarked(manga.id)) {
                    removeBookmark(manga.id);
                  } else {
                    addBookmark({
                      id: manga.id,
                      title: manga.title,
                      slug: manga.slug,
                      coverUrl: manga.cover_url,
                      source: manga.source || 'bacakomik',
                      author: manga.author,
                      status: manga.status,
                      genres: manga.genres
                    });
                  }
                }}
                className={`text-center px-6 py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  isBookmarked(manga.id) 
                    ? 'bg-white/10 text-white hover:bg-white/15 border border-white/20' 
                    : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                }`}
              >
                {isBookmarked(manga.id) ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-[#F27D26]" />
                    Tersimpan
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Simpan ke Koleksi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Synopsis Section */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">Sinopsis</h2>
        <p className="text-zinc-300 leading-relaxed text-sm md:text-base max-w-4xl whitespace-pre-line">
          {manga.synopsis}
        </p>
      </section>

      {/* Chapters Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Daftar Chapter
            </h2>

            <div className="flex items-center gap-2">
              {hasIdChapters && (
                <button
                  onClick={() => switchChapterLang('id')}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${chapterLang === 'id' ? 'bg-[#F27D26] text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  🇮🇩 ID ({allChapters.id.length})
                </button>
              )}
              {hasEnChapters && (
                <button
                  onClick={() => switchChapterLang('en')}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${chapterLang === 'en' ? 'bg-[#F27D26] text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  🇬🇧 EN ({allChapters.en.length})
                </button>
              )}
              <span className="text-white/30 text-xs">{chapters.length} ch</span>
            </div>
          </div>

          {usingFallbackLang && (
            <div className="flex items-center gap-2 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-lg px-4 py-3 mb-4">
              <Globe className="w-4 h-4 text-[#F27D26] flex-shrink-0" />
              <p className="text-xs text-[#F27D26]">
                Chapter bahasa Indonesia belum tersedia. Menampilkan {chapters.length} chapter bahasa Inggris.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {chapters.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#111115] border border-white/10 flex items-center justify-center text-[#F27D26]">
                  <BookX className="w-6 h-6 opacity-75" />
                </div>
                <p className="text-zinc-400 text-sm max-w-sm">
                  Tidak ada chapter yang tersedia untuk komik ini saat ini.
                </p>
              </div>
            ) : (
              chapters.map((chapter: any) => {
                const chapterHref = `/manga/${manga.slug}/chapter-${chapter.id}`;

                return (
                  <Link
                    key={chapter.id}
                    href={chapterHref}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                      <span className="font-bold text-white group-hover:text-[#F27D26] transition-colors flex items-center gap-2">
                        Chapter {chapter.chapter_number}
                      </span>
                      {chapter.title && chapter.title !== `Chapter ${chapter.chapter_number}` && (
                        <>
                          <span className="hidden md:inline text-white/20">—</span>
                          <span className="text-white/60 text-sm">{chapter.title}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end text-xs text-white/40">
                        <span>{chapter.scanlator || 'Komik Indo'}</span>
                        <span>{chapter.published_at ? new Date(chapter.published_at).toLocaleDateString() : '—'}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F27D26]" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}