import Link from "next/link";
import { Manga } from "../data/mockData";
import { Star } from "lucide-react";

interface MangaCardProps {
  manga: Manga;
  key?: string | number;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link href={`/manga/${manga.slug}`} className="group flex flex-col gap-2 cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5">
        <img 
          src={manga.cover_url} 
          alt={manga.title} 
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white">
          ★ {manga.rating}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div>
        <h3 className="text-sm font-semibold truncate text-white group-hover:text-[#F27D26] transition-colors">
          {manga.title}
        </h3>
        <p className="text-[11px] text-white/40 uppercase mt-0.5 truncate">
          {manga.genres.join(" • ")}
        </p>
      </div>
    </Link>
  );
}
