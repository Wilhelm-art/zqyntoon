"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Maximize,
  Minimize,
  Sliders,
  BookOpen,
  ArrowLeft,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import { useHistoryStore } from "@/store/historyStore";
import type { ChapterPagesResult, ComicDetail } from "@/lib/scraper/bacakomik";

interface ReaderViewProps {
  initialData: ChapterPagesResult;
  comicDetail?: ComicDetail;
}

export function ReaderView({ initialData, comicDetail }: ReaderViewProps) {
  const router = useRouter();
  const { readingMode, imageWidth, setReadingMode, setImageWidth } = useReaderStore();
  const { saveProgress } = useHistoryStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const totalPages = initialData.pages.length;

  // Track progress into history store
  useEffect(() => {
    if (comicDetail) {
      saveProgress({
        comicSlug: initialData.comicSlug || comicDetail.slug,
        comicTitle: comicDetail.title,
        cover: comicDetail.cover,
        chapterId: initialData.chapterSlug,
        chapterTitle: initialData.title,
        progressPercent: totalPages > 0 ? Math.round(((currentPageIndex + 1) / totalPages) * 100) : 0,
      });
    }
  }, [comicDetail, initialData, currentPageIndex, totalPages, saveProgress]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        if (readingMode === "paged") {
          if (currentPageIndex < totalPages - 1) {
            setCurrentPageIndex((prev) => prev + 1);
          } else if (initialData.nextChapterSlug) {
            router.push(`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.nextChapterSlug}`);
          }
        }
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        if (readingMode === "paged") {
          if (currentPageIndex > 0) {
            setCurrentPageIndex((prev) => prev - 1);
          } else if (initialData.prevChapterSlug) {
            router.push(`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.prevChapterSlug}`);
          }
        }
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        setShowControls((prev) => !prev);
      }
    },
    [currentPageIndex, totalPages, readingMode, initialData, comicDetail, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-hide controls on scroll in webtoon mode
  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 150) {
        setShowControls(false);
      } else if (currentScroll < lastScroll) {
        setShowControls(true);
      }
      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const widthClass =
    imageWidth === "narrow"
      ? "max-w-2xl"
      : imageWidth === "full"
      ? "max-w-none w-full"
      : "max-w-4xl";

  const retryImage = (idx: number) => {
    setFailedImages((prev) => ({ ...prev, [idx]: false }));
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07080B] text-gray-100 flex flex-col select-none relative"
      onClick={() => {
        // Toggle controls on canvas click
        if (settingsOpen) setSettingsOpen(false);
        else setShowControls((prev) => !prev);
      }}
    >
      {/* 1. Floating Top Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-[#0A0C12]/95 backdrop-blur-md border-b border-white/10 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href={`/manga/${initialData.comicSlug || comicDetail?.slug || ""}`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors shrink-0"
              title="Kembali ke Detail Komik"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="truncate">
              <h1 className="text-sm font-bold text-white truncate leading-tight">
                {comicDetail?.title || initialData.title}
              </h1>
              <p className="text-[11px] text-[#F27D26] truncate font-medium">
                {initialData.title}
              </p>
            </div>
          </div>

          {/* Center: Chapter Quick Selector */}
          {comicDetail && comicDetail.chapters.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <select
                value={initialData.chapterSlug}
                onChange={(e) => {
                  router.push(`/manga/${comicDetail.slug}/${e.target.value}`);
                }}
                className="bg-[#141722] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-[#F27D26]"
              >
                {comicDetail.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions: Prev/Next Chapter & Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            {initialData.prevChapterSlug && (
              <Link
                href={`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.prevChapterSlug}`}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Chapter Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            )}

            {initialData.nextChapterSlug && (
              <Link
                href={`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.nextChapterSlug}`}
                className="p-1.5 rounded-lg bg-[#F27D26] text-black font-bold hover:bg-[#FFA24D] transition-colors"
                title="Chapter Selanjutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors ml-1"
              title="Pengaturan Reader"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors hidden sm:block"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Settings Dropdown */}
        {settingsOpen && (
          <div className="border-t border-white/10 bg-[#0F1117] p-4 max-w-md ml-auto mr-4 rounded-b-xl shadow-2xl animate-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Pengaturan Tampilan
            </h4>

            {/* Reading Mode */}
            <div className="space-y-2 mb-4">
              <span className="text-xs text-gray-300">Mode Membaca:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setReadingMode("webtoon")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    readingMode === "webtoon"
                      ? "bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/40"
                      : "bg-[#171A23] text-gray-400 border-white/5 hover:text-white"
                  }`}
                >
                  Webtoon (Vertikal)
                </button>
                <button
                  onClick={() => setReadingMode("paged")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    readingMode === "paged"
                      ? "bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/40"
                      : "bg-[#171A23] text-gray-400 border-white/5 hover:text-white"
                  }`}
                >
                  Halaman (Slide)
                </button>
              </div>
            </div>

            {/* Image Width */}
            <div className="space-y-2">
              <span className="text-xs text-gray-300">Lebar Gambar:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setImageWidth("narrow")}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    imageWidth === "narrow"
                      ? "bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/40"
                      : "bg-[#171A23] text-gray-400 border-white/5 hover:text-white"
                  }`}
                >
                  Ramping
                </button>
                <button
                  onClick={() => setImageWidth("default")}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    imageWidth === "default"
                      ? "bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/40"
                      : "bg-[#171A23] text-gray-400 border-white/5 hover:text-white"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setImageWidth("full")}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    imageWidth === "full"
                      ? "bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/40"
                      : "bg-[#171A23] text-gray-400 border-white/5 hover:text-white"
                  }`}
                >
                  Penuh
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Reading Canvas */}
      <main className="flex-1 pt-14 pb-20 flex flex-col items-center justify-center">
        {totalPages === 0 ? (
          <div className="py-24 text-center px-4">
            <p className="text-gray-400 text-base mb-4">
              Gambar chapter sedang dalam proses pemuatan atau tidak tersedia.
            </p>
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 bg-[#F27D26] text-black font-semibold rounded-lg text-sm"
            >
              Muat Ulang Halaman
            </button>
          </div>
        ) : readingMode === "webtoon" ? (
          /* Webtoon Continuous Scroll (Gapless) */
          <div className={`w-full ${widthClass} mx-auto flex flex-col items-center bg-black shadow-2xl`}>
            {initialData.pages.map((imgUrl, idx) => {
              const proxiedUrl = `/api/proxy?url=${encodeURIComponent(imgUrl)}`;
              const isFailed = failedImages[idx];

              return (
                <div key={idx} className="relative w-full bg-[#0D0E14] overflow-hidden min-h-[300px]">
                  {isFailed ? (
                    <div className="py-16 px-4 text-center space-y-3 bg-[#12141D] border border-white/5">
                      <p className="text-xs text-gray-400">Gagal memuat gambar lembar #{idx + 1}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retryImage(idx);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F27D26] text-black text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Coba Lagi
                      </button>
                    </div>
                  ) : (
                    /* Native img for exact gapless aspect ratio webtoon display */
                    <img
                      src={proxiedUrl}
                      alt={`Halaman ${idx + 1}`}
                      loading={idx < 3 ? "eager" : "lazy"}
                      className="w-full h-auto block select-none"
                      onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Paged Mode (Single Page) */
          <div
            className={`w-full ${widthClass} mx-auto flex flex-col items-center justify-center px-2 py-6`}
            onClick={(e) => {
              // Click left half -> prev, click right half -> next
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 2) {
                if (currentPageIndex > 0) setCurrentPageIndex((prev) => prev - 1);
              } else {
                if (currentPageIndex < totalPages - 1) setCurrentPageIndex((prev) => prev + 1);
              }
            }}
          >
            <div className="relative w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 min-h-[450px] flex items-center justify-center">
              {failedImages[currentPageIndex] ? (
                <div className="py-20 text-center space-y-3">
                  <p className="text-sm text-gray-400">Gagal memuat halaman ini</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      retryImage(currentPageIndex);
                    }}
                    className="px-4 py-2 bg-[#F27D26] text-black text-xs font-bold rounded-lg"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <img
                  src={`/api/proxy?url=${encodeURIComponent(initialData.pages[currentPageIndex])}`}
                  alt={`Halaman ${currentPageIndex + 1}`}
                  className="max-h-[85vh] w-auto mx-auto object-contain select-none"
                  onError={() => setFailedImages((prev) => ({ ...prev, [currentPageIndex]: true }))}
                />
              )}
            </div>

            {/* Paged mode bottom helper text */}
            <div className="mt-4 flex items-center justify-between w-full max-w-2xl px-2 text-xs text-gray-400">
              <button
                disabled={currentPageIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPageIndex((p) => Math.max(0, p - 1));
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
              >
                ← Sebelumnya
              </button>
              <span>
                Halaman <strong>{currentPageIndex + 1}</strong> dari {totalPages}
              </span>
              <button
                disabled={currentPageIndex === totalPages - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1));
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}

        {/* 3. End of Chapter Card Banner */}
        <div className="max-w-xl mx-auto px-4 py-12 text-center w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-white">
            Kamu telah menyelesaikan {initialData.title}
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {initialData.nextChapterSlug ? (
              <Link
                href={`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.nextChapterSlug}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F27D26] hover:bg-[#FFA24D] text-black font-bold text-sm shadow-[0_4px_20px_rgba(242,125,38,0.4)] flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Chapter Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="text-sm text-gray-400 font-medium">
                Ini adalah chapter terbaru yang rilis.
              </span>
            )}

            <Link
              href={`/manga/${initialData.comicSlug || comicDetail?.slug}`}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm border border-white/10"
            >
              Daftar Chapter
            </Link>
          </div>
        </div>
      </main>

      {/* 4. Floating Bottom Dock */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0A0C12]/95 backdrop-blur-md border-t border-white/10 py-2.5 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-4 text-xs">
          <span className="text-gray-400 font-medium hidden sm:inline">
            Total {totalPages} Lembar Gambar
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {initialData.prevChapterSlug && (
              <Link
                href={`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.prevChapterSlug}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Chapter Sebelumnya</span>
              </Link>
            )}

            {initialData.nextChapterSlug && (
              <Link
                href={`/manga/${initialData.comicSlug || comicDetail?.slug}/${initialData.nextChapterSlug}`}
                className="px-4 py-1.5 rounded-lg bg-[#F27D26] text-black font-bold hover:bg-[#FFA24D] flex items-center gap-1 shadow-md"
              >
                <span>Chapter Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
