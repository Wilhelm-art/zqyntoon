"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, BookOpen } from "lucide-react";
import type { ComicItem } from "@/lib/scraper/bacakomik";

interface MangaCardProps {
  comic: ComicItem;
  priority?: boolean;
}

export function MangaCard({ comic, priority = false }: MangaCardProps) {
  const [imgError, setImgError] = useState(false);

  // Route image via our proxy to prevent 403 Forbidden from CDN
  const proxiedCover = comic.cover
    ? `/api/proxy?url=${encodeURIComponent(comic.cover)}`
    : "/cover-placeholder.svg";

  const typeColor =
    comic.type?.toLowerCase() === "manhwa"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
      : comic.type?.toLowerCase() === "manhua"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : "bg-orange-500/20 text-orange-300 border-orange-500/30";

  return (
    <Link
      href={`/manga/${comic.slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#0F1117] border border-white/5 hover:border-[#F27D26]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(242,125,38,0.12)] hover:-translate-y-1"
    >
      {/* Thumbnail Aspect 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#171A23]">
        {/* Subtle blurred ambient backdrop to enhance colors and fill framing */}
        <div className="absolute inset-0 filter blur-xl scale-110 opacity-30 pointer-events-none">
          <Image
            src={imgError ? "/cover-placeholder.svg" : proxiedCover}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <Image
          src={imgError ? "/cover-placeholder.svg" : proxiedCover}
          alt={comic.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          priority={priority}
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized
        />

        {/* Gradient overlay: Subtle at top, delicate fade at bottom for badge contrast without dimming cover artwork */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117]/90 via-[#0F1117]/10 to-black/20 pointer-events-none group-hover:opacity-75 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
          {comic.type && (
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border backdrop-blur-md ${typeColor}`}
            >
              {comic.type}
            </span>
          )}

          {comic.rating && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 bg-black/60 border border-amber-500/20 rounded-md backdrop-blur-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {comic.rating}
            </span>
          )}
        </div>

        {/* Bottom Chapter Badge inside Image */}
        {comic.latestChapter && (
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white/90 bg-black/75 backdrop-blur-md rounded-md border border-white/10 truncate max-w-full">
              <BookOpen className="w-3 h-3 text-[#F27D26] shrink-0" />
              <span className="truncate">{comic.latestChapter}</span>
            </span>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1">
        <h3
          className="font-semibold text-sm text-gray-100 group-hover:text-[#F27D26] transition-colors line-clamp-2 leading-snug"
          title={comic.title}
        >
          {comic.title}
        </h3>

        {comic.updatedAt && (
          <span className="text-[11px] text-gray-500 font-normal">
            {comic.updatedAt}
          </span>
        )}
      </div>
    </Link>
  );
}
