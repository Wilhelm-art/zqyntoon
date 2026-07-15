/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { getMangaDetails, getMangaChapters, getCoverUrlWithFallback } from "@/lib/api/mangadex";
import { ChevronRight, Globe, ExternalLink } from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect, use } from "react";

export default function Series({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLanguageStore();

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterLang, setChapterLang] = useState<'en' | 'id'>('id');
  const [usingFallbackLang, setUsingFallbackLang] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allChapters, setAllChapters] = useState<{ en: any[]; id: any[] }>({ en: [], id: [] });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [mangaData, rawChapters] = await Promise.all([
          getMangaDetails(slug),
          getMangaChapters(slug, ['en', 'id'])
        ]);

        const coverArt = mangaData.relationships?.find((r: any) => r.type === 'cover_art');
        const author = mangaData.relationships?.find((r: any) => r.type === 'author');

        let title = 'Unknown Title';
        if (mangaData.attributes.title) {
          title = mangaData.attributes.title.en || mangaData.attributes.title.id || Object.values(mangaData.attributes.title)[0] as string || title;
        }

        let description = 'No synopsis available.';
        if (mangaData.attributes.description && typeof mangaData.attributes.description === 'object') {
          description = mangaData.attributes.description.en || mangaData.attributes.description.id || Object.values(mangaData.attributes.description)[0] as string || description;
        }

        const genres = (mangaData.attributes.tags ?? [])
          .filter((t: any) => t.attributes?.group === 'genre' || t.attributes?.group === 'theme')
          .map((t: any) => t.attributes?.name?.en || Object.values(t.attributes?.name ?? {})[0])
          .slice(0, 4);

        // Synchronous — cover is now based on MangaDex ID only (no AniList fallback)
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

        // Map a chapter to display format
        const mapChapter = (ch: any) => {
          const group = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
          return {
            id: ch.id,
            chapter_number: ch.attributes.chapter || 'Oneshot',
            title: ch.attributes.title || null,
            published_at: ch.attributes.readableAt || ch.attributes.publishAt,
            scanlator: group?.attributes?.name || 'Official',
            externalUrl: ch.attributes.externalUrl || null,
          };
        };

        const idChapters = rawChapters
          .filter((ch: any) => ch.attributes.translatedLanguage === 'id')
          .map(mapChapter);

        const enChapters = rawChapters
          .filter((ch: any) => ch.attributes.translatedLanguage === 'en')
          .map(mapChapter);

        setAllChapters({ en: enChapters, id: idChapters });

        // Smart language selection:
        // If user wants ID but no ID chapters exist → auto-fallback to EN
        const preferredLang = lang as 'en' | 'id';
        const preferredList = preferredLang === 'id' ? idChapters : enChapters;
        const fallbackList = preferredLang === 'id' ? enChapters : idChapters;

        if (preferredList.length > 0) {
          setChapterLang(preferredLang);
          setChapters(preferredList);
          setUsingFallbackLang(false);
        } else if (fallbackList.length > 0) {
          const fallback = preferredLang === 'id' ? 'en' : 'id';
          setChapterLang(fallback);
          setChapters(fallbackList);
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
    loadData();
  }, [slug, lang]);

  // Switch chapter language manually
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

  if (!manga) return <div className="text-center py-20 text-white">Manga not found</div>;

  const firstChapterId = chapters.length > 0 ? chapters[chapters.length - 1].id : null;
  const hasEnChapters = allChapters.en.length > 0;
  const hasIdChapters = allChapters.id.length > 0;

  return (
    <main className="flex-1">
      {/* Banner / Cover Section */}
      <section className="relative">
        <div className="h-[40vh] md:h-[50vh] w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-20" />
          <img
            src={manga.cover_url}
            alt={manga.title}
            className="w-full h-full object-cover object-top opacity-50"
            onError={(e) => { (e.target as HTMLImageElement).src = '/cover-placeholder.svg'; }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-30 -mt-32 md:-mt-48 flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0 shadow-2xl shadow-black rounded-lg overflow-hidden border border-white/10 bg-[#121212]">
            <img
              src={manga.cover_url}
              alt={manga.title}
              className="w-full h-auto aspect-[2/3] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/cover-placeholder.svg'; }}
            />
          </div>

          <div className="flex flex-col justify-end pb-4 space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white">
              {manga.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
              <span className="text-white/80">{manga.author}</span>
              <span className="text-white/40">•</span>
              <span className={manga.status === 'ONGOING' ? 'text-green-400' : 'text-blue-400'}>
                {manga.status}
              </span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {manga.genres.map((genre: string) => (
                <span key={genre} className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href={firstChapterId ? `/manga/${manga.slug}/chapter-${firstChapterId}` : '#'}
                className={`text-center px-8 py-3 rounded-md font-bold text-sm transition-colors ${firstChapterId ? 'bg-[#F27D26] hover:bg-[#ff9d5c] text-black' : 'bg-white/10 text-white/40 cursor-not-allowed pointer-events-none'}`}
              >
                {lang === 'id' ? 'BACA CHAPTER PERTAMA' : 'READ FIRST CHAPTER'}
              </Link>
              <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-md font-bold text-sm transition-colors opacity-50 cursor-not-allowed pointer-events-none">
                + {lang === 'id' ? 'SIMPAN' : 'WISHLIST'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* Left Column (Synopsis) */}
        <div className="lg:w-1/3">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">
            {lang === 'id' ? 'Sinopsis' : 'Synopsis'}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
            {manga.synopsis}
          </p>
        </div>

        {/* Right Column (Chapters) */}
        <div className="lg:w-2/3">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <h3 className="text-lg font-medium text-white">
              {lang === 'id' ? 'Daftar Chapter' : 'Chapter List'}
            </h3>

            {/* Language switcher for chapters */}
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

          {/* Fallback language notice */}
          {usingFallbackLang && (
            <div className="flex items-center gap-2 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-lg px-4 py-3 mb-4">
              <Globe className="w-4 h-4 text-[#F27D26] flex-shrink-0" />
              <p className="text-xs text-[#F27D26]">
                {lang === 'id'
                  ? `Chapter bahasa Indonesia belum tersedia. Menampilkan ${chapters.length} chapter bahasa Inggris.`
                  : `No English chapters available. Showing ${chapters.length} Indonesian chapters.`}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {chapters.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <span className="text-4xl">📭</span>
                <p className="text-white/40">
                  {lang === 'id'
                    ? 'Tidak ada chapter yang tersedia untuk manga ini.'
                    : 'No chapters available for this manga.'}
                </p>
              </div>
            ) : (
              chapters.map((chapter: any) => {
                const isExternal = !!chapter.externalUrl;
                const chapterHref = isExternal 
                  ? chapter.externalUrl 
                  : `/manga/${manga.slug}/chapter-${chapter.id}`;

                return (
                  <Link
                    key={chapter.id}
                    href={chapterHref}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                      <span className="font-bold text-white group-hover:text-[#F27D26] transition-colors flex items-center gap-2">
                        {lang === 'id' ? 'Chapter' : 'Ch.'} {chapter.chapter_number}
                        {isExternal && <ExternalLink className="w-3 h-3 text-[#F27D26]" />}
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
                        <span className={isExternal ? "text-[#F27D26]" : ""}>
                          {isExternal ? "Official Link" : chapter.scanlator}
                        </span>
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