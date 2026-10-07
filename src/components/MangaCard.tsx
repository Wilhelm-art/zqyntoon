/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";

interface MangaCardData {
  id: string;
  title: string;
  slug?: string;
  synopsis?: string;
  cover_url?: string | null;
  coverUrl?: string | null;
  status?: string;
  author?: string;
  genres?: string[];
  rating?: number | string | null;
  source?: string;
}

interface MangaCardProps {
  manga: MangaCardData;
  lang?: string;
}

export function MangaCard({ manga, lang = "id" }: MangaCardProps) {
  const targetSlug = manga.slug || manga.id;
  const cover = manga.cover_url || manga.coverUrl || "/cover-placeholder.svg";

  return (
    <Link href={`/manga/${targetSlug}`} className="group flex flex-col gap-2 cursor-pointer select-none">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#111115] border border-white/5 group-hover:border-[#F27D26]/40 transition-all duration-300 shadow-sm">
        <img
          src={cover}
          alt={manga.title}
          className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (typeof window !== 'undefined' && target.src !== window.location.origin + "/cover-placeholder.svg") {
              target.src = "/cover-placeholder.svg";
            }
          }}
        />

        {/* Source badge */}
        {manga.source && manga.source === 'bacakomik' && (
          <div className="absolute top-2 right-2 bg-[#F27D26] px-2 py-0.5 rounded-full text-[9px] font-black text-black uppercase tracking-wider shadow-md">
            ID Komik
          </div>
        )}

        {/* Status / Rating badge */}
        <div className="absolute bottom-2 left-2 bg-[#070709]/85 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-mono text-white/90 flex items-center gap-1 shadow-sm">
          {manga.rating != null
            ? `★ ${manga.rating}`
            : manga.status?.toUpperCase() === "ONGOING"
            ? (lang === "id" ? "Berlanjut" : "Ongoing")
            : manga.status?.toUpperCase() === "COMPLETED" || manga.status === "Tamat"
            ? (lang === "id" ? "Tamat" : "Completed")
            : manga.status || "—"}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div>
        <h3 className="text-sm font-semibold truncate text-white group-hover:text-[#F27D26] transition-colors">
          {manga.title}
        </h3>
        <p className="text-[11px] text-white/40 uppercase mt-0.5 truncate">
          {manga.genres && manga.genres.length > 0 ? manga.genres.join(" • ") : manga.author || "—"}
        </p>
      </div>
    </Link>
  );
}
