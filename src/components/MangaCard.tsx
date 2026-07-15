/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";

interface MangaCardData {
  id: string;
  title: string;
  slug: string;
  synopsis?: string;
  cover_url: string | null;
  status: string;
  author: string;
  genres: string[];
  rating: number | null;
}

interface MangaCardProps {
  manga: MangaCardData;
  lang?: string;
}

export function MangaCard({ manga, lang = "id" }: MangaCardProps) {
  return (
    <Link href={`/manga/${manga.slug}`} className="group flex flex-col gap-2 cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5">
        <img
          src={manga.cover_url || "/cover-placeholder.svg"}
          alt={manga.title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== window.location.origin + "/cover-placeholder.svg") {
              target.src = "/cover-placeholder.svg";
            }
          }}
        />
        {/* Status badge instead of null rating */}
        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white">
          {manga.rating != null
            ? `★ ${manga.rating}`
            : manga.status === "ONGOING"
            ? (lang === "id" ? "Berlanjut" : "Ongoing")
            : manga.status === "COMPLETED"
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
