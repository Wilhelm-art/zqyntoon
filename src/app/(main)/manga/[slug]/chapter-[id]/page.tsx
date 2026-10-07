/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getMangaDetails, getMangaChapters, getChapterPages, getMangaTitle } from "@/lib/api/mangadex";
import { ChevronLeft, ChevronRight, Menu, Settings, Columns, AlignJustify, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { use } from "react";
import { useLanguageStore } from "@/store/languageStore";
import { useHistoryStore } from "@/store/historyStore";

export default function Reader({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = use(params);
  const { lang } = useLanguageStore();
  const { addHistory } = useHistoryStore();
  
  const [viewMode, setViewMode] = useState<"vertical" | "paged">("vertical");
  const [currentPage, setCurrentPage] = useState(0);
  const [showNav, setShowNav] = useState(true);
  
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanSlug = decodeURIComponent(slug);
  const cleanId = decodeURIComponent(id);

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (viewMode === "paged") return;
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      const scrolled = document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
      const progressBar = document.getElementById("reading-progress");
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
      
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  // Keyboard navigation for paged mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "paged") return;
      if (e.key === "ArrowRight") {
         if (currentPage < pages.length - 1) setCurrentPage(p => p + 1);
      } else if (e.key === "ArrowLeft") {
         if (currentPage > 0) setCurrentPage(p => p - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentPage, pages]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const isBacakomikChapter = 
          cleanId.startsWith('bk-') || 
          cleanId.startsWith('bk:') || 
          cleanId.startsWith('id-scraper') || 
          cleanSlug.startsWith('bk-') || 
          cleanSlug.startsWith('bk:') || 
          cleanSlug.startsWith('id-scraper') ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

        // 1. Direct Indonesian chapter reader (Bacakomik)
        if (isBacakomikChapter) {
          let detailSlug = cleanSlug;
          if (!detailSlug.startsWith('bk-') && !detailSlug.startsWith('bk:')) {
            const match = cleanId.match(/^(bk[-:])?(.+?)-chapter-/i);
            if (match) {
              detailSlug = `bk-${match[2]}`;
            }
          }

          const [detailRes, pagesRes] = await Promise.all([
            fetch(`/api/id-scraper/detail?slug=${encodeURIComponent(detailSlug)}`).catch(() => null),
            fetch(`/api/id-scraper/pages?chapterSlug=${encodeURIComponent(cleanId)}`),
          ]);

          if (!pagesRes || !pagesRes.ok) {
            throw new Error('Gagal memuat halaman chapter komik. Server gambar sedang sibuk.');
          }

          const pagesData = await pagesRes.json();
          if (!pagesData.pages || pagesData.pages.length === 0) {
            throw new Error('Tidak ada halaman gambar yang ditemukan untuk chapter ini.');
          }

          const detailData = detailRes && detailRes.ok ? await detailRes.json() : null;

          const proxiedPages = pagesData.pages.map((p: string) =>
            `/api/proxy?url=${encodeURIComponent(p)}`
          );

          const finalChapters = (detailData?.chapters || []).map((ch: any) => ({
            id: ch.id,
            chapterNumber: ch.chapter_number,
            title: ch.title,
          }));

          const fallbackTitle = detailData?.title || cleanSlug.replace(/^bk[-:]/i, '').replace(/-/g, ' ');

          setManga({
            id: detailData?.id || detailSlug,
            title: fallbackTitle,
            slug: detailData?.slug || detailSlug,
            cover_url: detailData?.coverUrl || '',
          });
          setPages(proxiedPages);
          setChapters(finalChapters);

          const currentChapterInfo = finalChapters.find((ch: any) => 
            ch.id === cleanId || 
            ch.id.replace(/^bk-/, '') === cleanId.replace(/^bk-/, '')
          );

          addHistory({
            mangaId: detailData?.id || detailSlug,
            mangaTitle: fallbackTitle,
            mangaSlug: detailData?.slug || detailSlug,
            chapterId: cleanId,
            chapterNumber: currentChapterInfo?.chapterNumber || cleanId.replace(/[^0-9.]/g, '') || '1',
            source: 'bacakomik',
          });

          setIsLoading(false);
          return;
        }

        // 2. MangaDex reader with automatic Indonesian Scraper fallback
        const [mangaData, rawChapters] = await Promise.all([
          getMangaDetails(cleanSlug),
          getMangaChapters(cleanSlug, lang === 'id' ? ['id', 'en'] : ['en', 'id'])
        ]);

        const finalChapters = rawChapters.map((ch: any) => ({
          id: ch.id,
          chapterNumber: ch.attributes?.chapter || 'Oneshot',
          title: ch.attributes?.title || null,
        }));
        setChapters(finalChapters);
        setManga(mangaData);

        let pagesData: string[] = [];
        try {
          pagesData = await getChapterPages(cleanId);
        } catch (dexErr) {
          console.warn('MangaDex pages load failed, trying Indonesian Scraper fallback for chapter:', dexErr);
          
          const mTitle = getMangaTitle(mangaData);
          if (mTitle && mTitle !== "Unknown") {
            const searchRes = await fetch(`/api/id-scraper/search?title=${encodeURIComponent(mTitle)}`);
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.results && searchData.results.length > 0) {
                const bkMatch = searchData.results[0];
                const bkDetailRes = await fetch(`/api/id-scraper/detail?slug=${encodeURIComponent(bkMatch.slug)}`);
                if (bkDetailRes.ok) {
                  const bkDetail = await bkDetailRes.json();
                  const targetChapterNum = finalChapters.find((ch: any) => ch.id === cleanId)?.chapterNumber;
                  const matchedBkChapter = bkDetail.chapters?.find((ch: any) => 
                    ch.chapter_number === targetChapterNum || 
                    parseFloat(ch.chapter_number) === parseFloat(targetChapterNum)
                  ) || bkDetail.chapters?.[0];

                  if (matchedBkChapter) {
                    const bkPagesRes = await fetch(`/api/id-scraper/pages?chapterSlug=${encodeURIComponent(matchedBkChapter.id)}`);
                    if (bkPagesRes.ok) {
                      const bkPagesData = await bkPagesRes.json();
                      if (bkPagesData.pages && bkPagesData.pages.length > 0) {
                        pagesData = bkPagesData.pages.map((p: string) => `/api/proxy?url=${encodeURIComponent(p)}`);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        if (!pagesData || pagesData.length === 0) {
          throw new Error('Chapter tidak dapat dimuat atau belum tersedia dalam format gambar.');
        }

        setPages(pagesData);

        const currentChapterInfo = finalChapters.find((ch: any) => ch.id === cleanId);
        if (currentChapterInfo) {
          addHistory({
            mangaId: mangaData.id,
            mangaTitle: getMangaTitle(mangaData),
            mangaSlug: cleanSlug,
            chapterId: cleanId,
            chapterNumber: currentChapterInfo.chapterNumber,
            source: 'mangadex'
          });
        }
        
      } catch (err: any) {
        setError(err.message || "Gagal memuat chapter.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [cleanSlug, cleanId, lang, addHistory]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] min-h-screen gap-4">
        <div className="w-10 h-10 border-2 border-[#F27D26] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
          Memuat halaman komik...
        </p>
      </div>
    );
  }

  if (error || !manga || pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-[#070709] min-h-screen gap-4 p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#111115] border border-white/10 flex items-center justify-center text-[#F27D26]">
          <AlertCircle className="w-8 h-8 opacity-75" />
        </div>
        <p className="text-center max-w-sm px-4 text-sm text-zinc-300 leading-relaxed">
          {error || "Chapter tidak ditemukan atau belum tersedia."}
        </p>
        <div className="flex gap-3">
          <Link 
            href={`/manga/${manga?.slug || cleanSlug}`}
            className="bg-[#F27D26] text-black px-6 py-2.5 rounded-lg font-bold text-sm"
          >
            Kembali ke Seri
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const seriesSlug = manga?.slug || cleanSlug;

  return (
    <div className="bg-black min-h-screen relative text-zinc-300">
      {/* Top Nav */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 transition-transform duration-300",
          showNav ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/manga/${seriesSlug}`} className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-serif italic font-light tracking-tight text-white line-clamp-1 text-lg">{manga.title}</h1>
              <p className="text-[10px] font-mono text-white/40 uppercase">Mode Baca Internal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setViewMode(prev => prev === "vertical" ? "paged" : "vertical");
                setCurrentPage(0);
                window.scrollTo(0,0);
              }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase"
              title="Ganti Mode Baca"
            >
              {viewMode === "vertical" ? <Columns className="w-4 h-4" /> : <AlignJustify className="w-4 h-4" />}
              <span className="hidden md:inline">{viewMode === "vertical" ? "Paged" : "Vertical"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reader Area */}
      <div className={cn("mx-auto", viewMode === "vertical" ? "pt-16 pb-32 max-w-3xl" : "h-screen pt-16 pb-16 flex flex-col items-center justify-center")}>
        {viewMode === "vertical" ? (
          <div className="flex flex-col items-center w-full">
            {pages.map((pageUrl, index) => (
              <div
                key={index}
                className="w-full relative min-h-[420px] sm:min-h-[650px] md:min-h-[850px] bg-[#0c0c0f] flex items-center justify-center overflow-hidden border-b border-black/30"
              >
                <img 
                  src={pageUrl} 
                  alt={`Halaman ${index + 1}`}
                  className="w-full h-auto block select-none"
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.minHeight = '240px';
                    target.style.background = '#141418';
                    target.alt = `Halaman ${index + 1} — Gagal memuat`;
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
              src={pages[currentPage]} 
              alt={`Halaman ${currentPage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {/* Click zones for paged mode */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-1/3 cursor-pointer"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            />
            <div 
              className="absolute top-0 bottom-0 right-0 w-1/3 cursor-pointer"
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
            />
          </div>
        )}
      </div>

      {/* Bottom Nav / Progress (Paged Mode) */}
      {viewMode === "paged" && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10 h-16 flex items-center justify-center px-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            Halaman {currentPage + 1} / {pages.length}
          </div>
        </div>
      )}

      {/* Progress Bar (Vertical Mode) */}
      {viewMode === "vertical" && (
        <div className="fixed top-0 left-0 h-1 bg-white/20 z-[60] w-full">
          <div id="reading-progress" className="h-full bg-[#F27D26] w-0 transition-all duration-150 ease-out" />
        </div>
      )}

      {/* Next Chapter Prompt (Vertical Mode) */}
      {viewMode === "vertical" && (
        <div className="max-w-3xl mx-auto p-8 border-t border-white/10 flex flex-col items-center">
          <p className="mb-4 text-[11px] font-mono text-white/40 uppercase tracking-widest">Akhir Chapter</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {chapters && chapters.length > 0 && (() => {
               const currentIndex = chapters.findIndex(
                 c => c.id === id || 
                      c.id === cleanId || 
                      c.id.replace(/^bk-/, '') === cleanId.replace(/^bk-/, '')
               );
               const nextChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
               const prevChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

               return (
                 <>
                   {prevChapter && (
                     <Link 
                       href={`/manga/${seriesSlug}/chapter-${prevChapter.id}`}
                       className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-md transition-colors text-sm flex items-center gap-2"
                     >
                       <ChevronLeft className="w-4 h-4" />
                       SEBELUMNYA
                     </Link>
                   )}
                   <Link 
                     href={`/manga/${seriesSlug}`}
                     className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-md transition-colors text-sm"
                   >
                     DAFTAR CHAPTER
                   </Link>
                   {nextChapter && (
                     <Link 
                       href={`/manga/${seriesSlug}/chapter-${nextChapter.id}`}
                       className="bg-[#F27D26] hover:bg-[#ff9d5c] text-black font-bold py-3 px-6 rounded-md transition-colors text-sm flex items-center gap-2"
                     >
                       SELANJUTNYA
                       <ChevronRight className="w-4 h-4" />
                     </Link>
                   )}
                 </>
               );
            })()}
            {(!chapters || chapters.length === 0) && (
              <Link 
                href={`/manga/${seriesSlug}`}
                className="bg-[#F27D26] hover:bg-[#ff9d5c] text-black font-bold py-3 px-8 rounded-md transition-colors text-sm"
              >
                KEMBALI KE SERI
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}