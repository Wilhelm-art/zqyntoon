"use client";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";

export default function GenreIndex() {
  const { lang } = useLanguageStore();
  const genres = ["Action", "Romance", "Fantasy", "Sci-Fi", "Horror", "Comedy", "Slice of Life", "Mystery", "Drama", "Supernatural", "Adventure", "Sports", "Psychological", "Mecha", "Historical", "Isekai"];

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight text-white mb-8">
        {lang === 'id' ? 'Jelajahi Genre' : 'Browse Genres'}
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {genres.map(genre => (
          <Link 
            key={genre} 
            href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}
            className="flex items-center justify-between p-6 rounded-xl bg-white/5 hover:bg-white/10 hover:border-[#F27D26]/50 border border-white/5 transition-all group"
          >
            <span className="text-white font-medium group-hover:text-[#F27D26] transition-colors">{genre}</span>
            <span className="text-white/20 group-hover:text-[#F27D26]/50 transition-colors">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
