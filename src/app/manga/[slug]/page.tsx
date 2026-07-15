"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_MANGA, MOCK_CHAPTERS } from "@/data/mockData";
import { ChevronRight } from "lucide-react";

export default function Series() {
  const { slug } = useParams();
  const manga = MOCK_MANGA.find(m => m.slug === slug);
  const chapters = manga ? MOCK_CHAPTERS[manga.slug] || [] : [];

  if (!manga) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        Series not found
      </div>
    );
  }

  return (
    <main className="flex-1">
      {/* Banner */}
      <div className="w-full h-64 md:h-80 relative overflow-hidden bg-[#121212]">
        <img 
          src={manga.cover_url} 
          alt={manga.title} 
          className="w-full h-full object-cover opacity-20 blur-md scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover & Quick Stats */}
          <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6 bg-[#1a1a1a]">
              <img src={manga.cover_url} alt={manga.title} className="w-full h-full object-cover" />
            </div>
            
            <Link 
              href={chapters.length > 0 ? `/manga/${manga.slug}/chapter-${chapters[chapters.length-1].chapter_number}` : '#'}
              className="w-full bg-[#F27D26] hover:bg-[#ff9d5c] text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
            >
              READ FIRST CHAPTER
            </Link>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-32">
            <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white mb-2">{manga.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/40 uppercase mb-6 font-mono tracking-wider">
              <span className="flex items-center gap-1 text-[#F27D26]">
                ★ {manga.rating}
              </span>
              <span>•</span>
              <span className="text-white/60">{manga.status}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {manga.author}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {manga.genres.map(genre => (
                <span key={genre} className="px-3 py-1 rounded bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                  {genre}
                </span>
              ))}
            </div>

            <div className="mb-12">
              <h2 className="text-lg font-medium tracking-tight text-white mb-4">Synopsis</h2>
              <p className="text-white/60 leading-relaxed text-sm italic">
                {manga.synopsis}
              </p>
            </div>

            {/* Chapter List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium tracking-tight text-white">Chapters</h2>
                <span className="text-[11px] text-white/40 uppercase font-mono">{chapters.length} chapters</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {chapters.length > 0 ? (
                  chapters.map(chapter => (
                    <Link 
                      key={chapter.id} 
                      href={`/manga/${manga.slug}/chapter-${chapter.chapter_number}`}
                      className="group flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm text-white group-hover:text-[#F27D26] transition-colors">
                          {chapter.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-white/40 uppercase">
                        <span className="hidden md:block">
                          {new Date(chapter.release_date).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#F27D26] transition-colors" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    No chapters available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
