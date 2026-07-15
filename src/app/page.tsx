"use client";
import { MOCK_MANGA } from "@/data/mockData";
import { MangaCard } from "@/components/MangaCard";

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[21/7] bg-[#121212]">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
          <img 
            src={MOCK_MANGA[0].cover_url} 
            alt="Hero Banner" 
            className="absolute right-0 top-0 w-2/3 h-full object-cover opacity-50"
          />
          <div className="relative z-20 h-full flex flex-col justify-center p-6 md:p-10 w-full md:w-2/3 space-y-3">
            <div className="flex gap-2 mb-2">
              <span className="bg-[#F27D26] text-black text-[10px] font-bold px-2 py-0.5 rounded">TRENDING #1</span>
              <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Action</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white line-clamp-1">
              {MOCK_MANGA[0].title}
            </h1>
            <p className="text-sm text-white/60 line-clamp-2 italic mb-4">
              {MOCK_MANGA[0].synopsis}
            </p>
            <div className="flex gap-4 pt-2">
              <button className="bg-white text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-zinc-200 transition-colors">
                READ CHAPTER 154
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors">
                + WISHLIST
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">Trending Now</h2>
          <a href="#" className="text-[#F27D26] text-xs font-semibold hover:underline">VIEW ALL</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {MOCK_MANGA.map(manga => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">Latest Updates</h2>
          <a href="#" className="text-[#F27D26] text-xs font-semibold hover:underline">VIEW ALL</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {MOCK_MANGA.slice().reverse().map(manga => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>

      {/* Genres Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">Browse Genres</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {["Action", "Romance", "Fantasy", "Sci-Fi", "Horror", "Comedy", "Slice of Life", "Mystery", "Drama", "Supernatural"].map(genre => (
            <button key={genre} className="px-4 py-2 rounded-full bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
              {genre}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
