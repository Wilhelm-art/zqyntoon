"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, Trash2, BookOpen } from "lucide-react";
import { useBookmarkStore } from "@/store/bookmarkStore";

export default function BookmarksPage() {
  const { bookmarks, removeBookmark } = useBookmarkStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Koleksi Bookmark
            </h1>
            <p className="text-sm text-gray-400">
              Komik favorit yang kamu simpan untuk dibaca nanti
            </p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-gray-300 font-semibold border border-white/10">
          {bookmarks.length} Komik Tersimpan
        </span>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {bookmarks.map((comic) => {
            const proxiedCover = comic.cover
              ? `/api/proxy?url=${encodeURIComponent(comic.cover)}`
              : "/cover-placeholder.svg";

            return (
              <div
                key={comic.slug}
                className="group relative flex flex-col rounded-xl overflow-hidden bg-[#0F1117] border border-white/5 hover:border-[#F27D26]/40 transition-all duration-300"
              >
                <Link href={`/manga/${comic.slug}`} className="relative aspect-[3/4] w-full bg-[#171A23]">
                  <Image
                    src={proxiedCover}
                    alt={comic.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-transparent to-transparent opacity-80" />
                </Link>

                <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                  <Link
                    href={`/manga/${comic.slug}`}
                    className="font-semibold text-sm text-gray-200 group-hover:text-[#F27D26] transition-colors line-clamp-2"
                  >
                    {comic.title}
                  </Link>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs text-gray-400">
                    <span className="uppercase text-[10px] font-bold text-gray-500">
                      {comic.type || "Manga"}
                    </span>
                    <button
                      onClick={() => removeBookmark(comic.slug)}
                      className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Hapus dari Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-200">
            Belum ada komik di bookmark kamu
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Jelajahi komik favoritmu dan tekan tombol &quot;Tambah Bookmark&quot; untuk menyimpannya di sini.
          </p>
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F27D26] text-black font-bold text-sm shadow-md hover:bg-[#FFA24D] transition-colors"
          >
            <BookOpen className="w-4 h-4 fill-black" />
            Jelajahi Komik Populer
          </Link>
        </div>
      )}
    </div>
  );
}
