"use client";

import Link from "next/link";
import Image from "next/image";
import { History, BookOpen, Clock } from "lucide-react";
import { useHistoryStore } from "@/store/historyStore";

export default function HistoryPage() {
  const { history } = useHistoryStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Riwayat Bacaan
            </h1>
            <p className="text-sm text-gray-400">
              Lanjutkan membaca chapter terakhir yang kamu buka
            </p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-gray-300 font-semibold border border-white/10">
          {history.length} Terbaca
        </span>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((item) => {
            const proxiedCover = item.cover
              ? `/api/proxy?url=${encodeURIComponent(item.cover)}`
              : "/cover-placeholder.svg";

            return (
              <div
                key={item.comicSlug}
                className="flex gap-3.5 p-3 rounded-2xl bg-[#0F1117] border border-white/5 hover:border-[#F27D26]/40 transition-all group"
              >
                <div className="relative w-20 aspect-[3/4] rounded-xl overflow-hidden bg-[#171A23] shrink-0">
                  <Image
                    src={proxiedCover}
                    alt={item.comicTitle}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <Link
                      href={`/manga/${item.comicSlug}`}
                      className="text-sm font-bold text-gray-100 group-hover:text-[#F27D26] transition-colors truncate block"
                    >
                      {item.comicTitle}
                    </Link>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {item.chapterTitle}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#F27D26] h-full rounded-full"
                        style={{ width: `${item.progressPercent || 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.readAt).toLocaleDateString("id-ID", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      <Link
                        href={`/manga/${item.comicSlug}/${item.chapterId}`}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#F27D26] text-black font-bold hover:bg-[#FFA24D] transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3 fill-black" />
                        Lanjut
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-200">
            Belum ada riwayat bacaan
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Mulai baca komik sekarang dan progres bacaanmu akan tercatat otomatis di sini.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F27D26] text-black font-bold text-sm shadow-md hover:bg-[#FFA24D] transition-colors"
          >
            <BookOpen className="w-4 h-4 fill-black" />
            Mulai Membaca
          </Link>
        </div>
      )}
    </div>
  );
}
