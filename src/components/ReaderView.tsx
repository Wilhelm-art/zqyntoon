"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
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

interface WebtoonPageItemProps {
  imgUrl: string;
  idx: number;
  isFailed?: boolean;
  isLoaded?: boolean;
  onRetry: (idx: number) => void;
  onIntersect: (idx: number) => void;
  onLoad: (idx: number) => void;
  onError: (idx: number) => void;
}

function WebtoonPageItem({
  imgUrl,
  idx,
  isFailed,
  isLoaded,
  onRetry,
  onIntersect,
  onLoad,
  onError,
}: WebtoonPageItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const el = itemRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onIntersect(idx);
          }
        }
      },
      { rootMargin: "1600px 0px" } // Proactively warm images 2-3 screens before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [idx, onIntersect]);

  const proxiedUrl = `/api/proxy?url=${encodeURIComponent(imgUrl)}${retryAttempt > 0 ? `&_r=${retryAttempt}` : ""}`;

  const handleImageError = () => {
    if (retryAttempt < 2) {
      setTimeout(() => {
        setRetryAttempt((prev) => prev + 1);
      }, 700 * (retryAttempt + 1));
    } else {
      onError(idx);
    }
  };

  return (
    <div
      ref={itemRef}
      className="relative w-full bg-[#0D0E14] overflow-hidden min-h-[300px]"
    >
      {isFailed ? (
        <div className="py-16 px-4 text-center space-y-3 bg-[#12141D] border border-white/5">
          <p className="text-xs text-gray-400">Gagal memuat gambar lembar #{idx + 1}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRetryAttempt(0);
              onRetry(idx);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F27D26] text-black text-xs font-bold hover:bg-[#FFA24D] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D12] animate-pulse">
              <span className="text-[11px] font-mono text-gray-500">
                Memuat lembar #{idx + 1}...
              </span>
            </div>
          )}
          <img
            src={proxiedUrl}
            alt={`Halaman ${idx + 1}`}
            loading={idx < 6 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={idx < 2 ? "high" : idx < 6 ? "auto" : "low"}
            className={`w-full h-auto block select-none transition-opacity duration-200 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => onLoad(idx)}
            onError={handleImageError}
          />
        </>
      )}
    </div>
  );
}

export function ReaderView({ initialData, comicDetail }: ReaderViewProps) {
  const router = useRouter();
  const { readingMode, imageWidth, setReadingMode, setImageWidth } = useReaderStore();
  const { saveProgress } = useHistoryStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [chapterDrawerOpen, setChapterDrawerOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const preloadedUrls = useRef<Set<string>>(new Set());
  const totalPages = initialData.pages.length;

  // Background image prefetcher for instant page transitions
  const prefetchImageUrl = useCallback((rawUrl: string) => {
    if (typeof window === "undefined" || !rawUrl) return;
    const proxied = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    if (preloadedUrls.current.has(proxied)) return;
    preloadedUrls.current.add(proxied);
    const img = new Image();
    img.decoding = "async";
    img.src = proxied;
  }, []);

  // Proactive initial prefetch: Warm up first 8 pages on chapter open
  useEffect(() => {
    if (!initialData.pages || initialData.pages.length === 0) return;
    const initialBatch = initialData.pages.slice(0, 8);
    initialBatch.forEach(prefetchImageUrl);
  }, [initialData.pages, prefetchImageUrl]);

  // Paged mode: Preload adjacent pages around current page index
  useEffect(() => {
    if (readingMode !== "paged" || !initialData.pages.length) return;
    if (currentPageIndex + 1 < totalPages) prefetchImageUrl(initialData.pages[currentPageIndex + 1]);
    if (currentPageIndex + 2 < totalPages) prefetchImageUrl(initialData.pages[currentPageIndex + 2]);
    if (currentPageIndex - 1 >= 0) prefetchImageUrl(initialData.pages[currentPageIndex - 1]);
  }, [currentPageIndex, readingMode, totalPages, initialData.pages, prefetchImageUrl]);

  // Webtoon mode: Callback when a page enters proximity
  const handlePageIntersect = useCallback(
    (idx: number) => {
      setCurrentPageIndex(idx);
      // Prefetch up to 8 pages ahead so reader never hits buffering
      for (let offset = 1; offset <= 8; offset++) {
        const targetIdx = idx + offset;
        if (targetIdx < totalPages) {
          prefetchImageUrl(initialData.pages[targetIdx]);
        }
      }
    },
    [totalPages, initialData.pages, prefetchImageUrl]
  );

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

  // Synchronize fullscreen state with native browser events (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (isNowFullscreen) {
        setShowControls(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fullscreen toggle targeting reader container with auto-hide controls
  const toggleFullscreen = () => {
    const el = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          setShowControls(false); // Otomatis sembunyikan bar navigasi saat fullscreen agar layar 100% immersive
        })
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
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

  // Smart auto-hide controls on scroll with directional hysteresis
  useEffect(() => {
    let lastScroll = typeof window !== "undefined" ? window.scrollY : 0;

    const handleScroll = () => {
      // In fullscreen mode, NEVER pop up controls on scroll! Fullscreen is pure reading mode.
      if (document.fullscreenElement) {
        return;
      }

      const currentScroll = window.scrollY;
      const diff = currentScroll - lastScroll;

      // Close to the very top: always show controls
      if (currentScroll < 60) {
        setShowControls(true);
        lastScroll = currentScroll;
        return;
      }

      // Significant scroll down (> 60px): hide controls
      if (diff > 60) {
        setShowControls(false);
        lastScroll = currentScroll;
      }
      // Significant intentional scroll up (> 80px): reveal controls
      else if (diff < -80) {
        setShowControls(true);
        lastScroll = currentScroll;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-hide controls in fullscreen after 3.5 seconds
  useEffect(() => {
    if (!showControls || !isFullscreen) return;
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, [showControls, isFullscreen]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // Swipe Left -> Next Page
        if (currentPageIndex < totalPages - 1) setCurrentPageIndex((p) => p + 1);
      } else {
        // Swipe Right -> Prev Page
        if (currentPageIndex > 0) setCurrentPageIndex((p) => p - 1);
      }
    }
    touchStartX.current = null;
  };

  const widthClass =
    imageWidth === "narrow"
      ? "max-w-2xl"
      : imageWidth === "full"
      ? "max-w-none w-full"
      : "max-w-4xl";

  const retryImage = (idx: number) => {
    setFailedImages((prev) => ({ ...prev, [idx]: false }));
    setLoadedImages((prev) => ({ ...prev, [idx]: false }));
  };

  return (
    <div
      ref={containerRef}
      style={{ filter: brightness < 100 ? `brightness(${brightness}%)` : undefined }}
      className="min-h-screen bg-[#07080B] text-gray-100 flex flex-col select-none relative transition-[filter] -mb-16 md:mb-0"
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Link
              href={`/manga/${initialData.comicSlug || comicDetail?.slug || ""}`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors shrink-0"
              title="Kembali ke Detail Komik"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="truncate">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                {comicDetail?.title || initialData.title}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#F27D26] truncate font-medium">
                {initialData.title}
              </p>
            </div>
          </div>

          {/* Center: Chapter Quick Selector (Desktop & Mobile Drawer Button) */}
          {comicDetail && comicDetail.chapters.length > 0 && (
            <>
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

              <button
                onClick={() => setChapterDrawerOpen(true)}
                className="sm:hidden px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[11px] font-semibold flex items-center gap-1 shrink-0"
                title="Pilih Chapter"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#F27D26]" />
                <span>Chapter</span>
              </button>
            </>
          )}

          {/* Actions: Prev/Next Chapter & Settings & Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Pengaturan Reader"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Layar Penuh"
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

            {/* Eye-Care Brightness Slider */}
            <div className="space-y-1.5 mt-4 pt-3 border-t border-white/5">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Kenyamanan Mata (Kecerahan):</span>
                <span className="font-mono text-[#F27D26] font-semibold">{brightness}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#F27D26] cursor-pointer h-1.5 bg-[#171A23] rounded-lg"
              />
            </div>
          </div>
        )}
      </header>

      {/* 2. Reading Canvas */}
      <div
        className={`flex-1 flex flex-col items-center justify-center transition-[padding] duration-300 ${
          showControls && !isFullscreen ? "pt-14 pb-20" : "pt-0 pb-6"
        }`}
      >
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
          /* Webtoon Continuous Scroll (Gapless with Sequential Prefetch) */
          <div className={`w-full ${widthClass} mx-auto flex flex-col items-center bg-black shadow-2xl`}>
            {initialData.pages.map((imgUrl, idx) => (
              <WebtoonPageItem
                key={idx}
                imgUrl={imgUrl}
                idx={idx}
                isFailed={failedImages[idx]}
                isLoaded={loadedImages[idx]}
                onRetry={retryImage}
                onIntersect={handlePageIntersect}
                onLoad={(i) => setLoadedImages((prev) => ({ ...prev, [i]: true }))}
                onError={(i) => setFailedImages((prev) => ({ ...prev, [i]: true }))}
              />
            ))}
          </div>
        ) : (
          /* Paged Mode (Single Page with Smooth Transitions & Warm Cache) */
          <div
            className={`w-full ${widthClass} mx-auto flex flex-col items-center justify-center px-2 py-6`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
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
                    className="px-4 py-2 bg-[#F27D26] text-black text-xs font-bold rounded-lg hover:bg-[#FFA24D] transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <div className="relative w-full flex items-center justify-center">
                  {!loadedImages[currentPageIndex] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D12] animate-pulse min-h-[450px]">
                      <span className="text-xs font-mono text-gray-500">
                        Memuat lembar #{currentPageIndex + 1}...
                      </span>
                    </div>
                  )}
                  <img
                    src={`/api/proxy?url=${encodeURIComponent(initialData.pages[currentPageIndex])}`}
                    alt={`Halaman ${currentPageIndex + 1}`}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className={`max-h-[85vh] w-auto mx-auto object-contain select-none transition-opacity duration-200 ${
                      loadedImages[currentPageIndex] ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setLoadedImages((prev) => ({ ...prev, [currentPageIndex]: true }))}
                    onError={() => setFailedImages((prev) => ({ ...prev, [currentPageIndex]: true }))}
                  />
                </div>
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
      </div>

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

      {/* 5. Mobile Chapter Jump Drawer */}
      {chapterDrawerOpen && comicDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setChapterDrawerOpen(false);
          }}
        >
          <div
            className="w-full sm:max-w-md bg-[#0F1117] border border-white/10 rounded-t-2xl sm:rounded-2xl max-h-[75vh] flex flex-col p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Pilih Chapter</h3>
                <p className="text-[11px] text-gray-400 truncate max-w-[260px]">{comicDetail.title}</p>
              </div>
              <button
                onClick={() => setChapterDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-white/5 py-2 space-y-1">
              {comicDetail.chapters.map((ch) => {
                const isCurrent = ch.id === initialData.chapterSlug;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setChapterDrawerOpen(false);
                      router.push(`/manga/${comicDetail.slug}/${ch.id}`);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      isCurrent
                        ? "bg-[#F27D26]/15 text-[#F27D26] font-bold"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate pr-2">{ch.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-[#F27D26] shrink-0">
                        Sedang Dibaca
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
