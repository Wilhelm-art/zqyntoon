"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, Bookmark, BookmarkCheck, BookOpen, Clock, CheckCircle } from "lucide-react";
import type { ComicDetail } from "@/lib/scraper/bacakomik";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useHistoryStore } from "@/store/historyStore";

interface ComicDetailClientProps {
  comic: ComicDetail;
}

export function ComicDetailClient({ comic }: ComicDetailClientProps) {
  const [chapterSearch, setChapterSearch] = useState("");
  const [sortDescending, setSortDescending] = useState(true);
  const [visibleCount, setVisibleCount] = useState(48);

  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const { getComicProgress } = useHistoryStore();

  const bookmarked = isBookmarked(comic.slug);
  const readingProgress = getComicProgress(comic.slug);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(comic.slug);
    } else {
      addBookmark({
        slug: comic.slug,
        title: comic.title,
        cover: comic.cover,
        type: comic.type,
      });
    }
  };

  // Sort and filter chapters
  const filteredChapters = comic.chapters
    .filter((ch) =>
      ch.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      ch.id.toLowerCase().includes(chapterSearch.toLowerCase())
    )
    .sort((a, b) => {
      // Natural sort
      return sortDescending ? 0 : -1;
    });

  const displayChapters = sortDescending ? filteredChapters : [...filteredChapters].reverse();
  const pagedChapters = chapterSearch.trim() ? displayChapters : displayChapters.slice(0, visibleCount);

  // Determine starting chapter for CTA
  const firstChapter = comic.chapters[comic.chapters.length - 1];
  const resumeChapter = readingProgress?.chapterId
    ? comic.chapters.find((c) => c.id === readingProgress.chapterId)
    : undefined;

  const targetChapter = resumeChapter || firstChapter || comic.chapters[0];

  return (
    <div className="space-y-8">
      {/* Action CTA Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        {targetChapter && (
          <Link
            href={`/manga/${comic.slug}/${targetChapter.id}`}
            className="px-6 py-3 rounded-xl bg-[#F27D26] hover:bg-[#e06a14] text-black font-bold text-sm sm:text-base flex items-center gap-2 shadow-[0_4px_20px_rgba(242,125,38,0.35)] transition-all hover:scale-105"
          >
            <BookOpen className="w-5 h-5 fill-black" />
            {resumeChapter
              ? `Lanjut Baca: ${resumeChapter.title}`
              : `Mulai Baca: ${targetChapter.title}`}
          </Link>
        )}

        <button
          onClick={toggleBookmark}
          className={`px-5 py-3 rounded-xl border text-sm sm:text-base font-semibold flex items-center gap-2 transition-all ${
            bookmarked
              ? "bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/40"
              : "bg-white/5 hover:bg-white/10 text-white border-white/10"
          }`}
        >
          {bookmarked ? (
            <>
              <BookmarkCheck className="w-5 h-5 text-[#F27D26]" />
              Tersimpan di Bookmark
            </>
          ) : (
            <>
              <Bookmark className="w-5 h-5 text-gray-400" />
              Tambah Bookmark
            </>
          )}
        </button>
      </div>

      {/* Chapter List Section */}
      <section className="bg-[#0F1117] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Daftar Chapter
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-gray-400">
              {comic.chapters.length} Total
            </span>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor chapter..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#171A23] border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#F27D26]/50"
              />
            </div>

            <button
              onClick={() => setSortDescending(!sortDescending)}
              title={sortDescending ? "Urutan: Terbaru Dulu" : "Urutan: Terlama Dulu"}
              className="p-2 rounded-lg bg-[#171A23] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chapter Grid / List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {pagedChapters.map((ch) => {
            const isRead = readingProgress?.chapterId === ch.id;

            return (
              <Link
                key={ch.id}
                href={`/manga/${comic.slug}/${ch.id}`}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                  isRead
                    ? "bg-[#171A23]/60 border-[#F27D26]/20 hover:border-[#F27D26]/50"
                    : "bg-[#141720] border-white/5 hover:border-white/15 hover:bg-[#1A1E2A]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isRead && (
                      <CheckCircle className="w-3.5 h-3.5 text-[#F27D26] shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-[#F27D26] transition-colors truncate">
                      {ch.title}
                    </span>
                  </div>
                  {ch.releaseDate && (
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {ch.releaseDate}
                    </span>
                  )}
                </div>

                <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 group-hover:bg-[#F27D26] group-hover:text-black font-semibold text-gray-400 transition-colors shrink-0">
                  Baca
                </span>
              </Link>
            );
          })}

          {displayChapters.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 text-sm">
              Tidak ada chapter yang cocok dengan pencarian &quot;{chapterSearch}&quot;
            </div>
          )}
        </div>

        {/* Load More Pagination Bar */}
        {!chapterSearch.trim() && visibleCount < displayChapters.length && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
            <span className="text-xs text-gray-400">
              Menampilkan <strong>{Math.min(visibleCount, displayChapters.length)}</strong> dari <strong>{displayChapters.length}</strong> chapter
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setVisibleCount((prev) => prev + 48)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                Muat 48 Lagi
              </button>
              <button
                onClick={() => setVisibleCount(displayChapters.length)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#F27D26]/10 hover:bg-[#F27D26]/20 text-[#F27D26] text-xs font-semibold border border-[#F27D26]/30 transition-colors"
              >
                Tampilkan Semua
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
