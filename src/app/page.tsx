import Link from "next/link";
import Image from "next/image";
import { Flame, Clock, Sparkles, BookOpen, ChevronRight, Star } from "lucide-react";
import { getLatestComics, getPopularComics } from "@/lib/scraper/bacakomik";
import { MangaCard } from "@/components/MangaCard";

// Revalidate home page every 5 minutes
export const revalidate = 300;

export default async function HomePage() {
  const [latestData, popularList] = await Promise.all([
    getLatestComics(1).catch(() => ({ comics: [], hasNextPage: false })),
    getPopularComics(1).catch(() => []),
  ]);

  const featuredComic = popularList[0] || latestData.comics[0];
  const featuredCover = featuredComic?.cover
    ? `/api/proxy?url=${encodeURIComponent(featuredComic.cover)}`
    : "/cover-placeholder.svg";

  const genres = [
    "Action",
    "Adventure",
    "Fantasy",
    "Isekai",
    "Manhwa",
    "Manhua",
    "Martial Arts",
    "Romance",
    "Comedy",
    "Sci-Fi",
    "Supernatural",
    "Slice of Life",
  ];

  return (
    <div className="min-h-screen pb-16 space-y-12">
      {/* 1. Hero Spotlight Banner */}
      {featuredComic && (
        <section className="relative w-full overflow-hidden border-b border-white/5 bg-[#0F1117]">
          {/* Ambient blurred backdrop */}
          <div className="absolute inset-0 overflow-hidden opacity-25 filter blur-3xl scale-110 pointer-events-none">
            <Image
              src={featuredCover}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Cover Card */}
            <div className="relative w-48 sm:w-60 md:w-72 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 group">
              <Image
                src={featuredCover}
                alt={featuredComic.title}
                fill
                priority
                fetchPriority="high"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#F27D26] text-black rounded-lg shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  Sorotan
                </span>
              </div>
            </div>

            {/* Spotlight Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20">
                  {featuredComic.type || "Komik Pilihan"}
                </span>
                {featuredComic.rating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Rating {featuredComic.rating}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {featuredComic.title}
              </h1>

              <p className="text-gray-400 text-sm sm:text-base line-clamp-3 max-w-2xl leading-relaxed">
                Nikmati petualangan seru komik {featuredComic.title} terjemahan Bahasa Indonesia terlengkap dengan kualitas gambar tajam dan reader internal tanpa gangguan iklan.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  href={`/manga/${featuredComic.slug}`}
                  className="px-6 py-3 rounded-xl bg-[#F27D26] hover:bg-[#e06a14] text-black font-bold text-sm sm:text-base flex items-center gap-2 shadow-[0_4px_20px_rgba(242,125,38,0.4)] transition-all hover:scale-105"
                >
                  <BookOpen className="w-4 h-4 fill-black" />
                  Baca Sekarang
                </Link>
                <Link
                  href={`/manga/${featuredComic.slug}`}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm sm:text-base border border-white/10 transition-colors"
                >
                  Detail Komik
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Genre Fast Filter Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((genre) => (
            <Link
              key={genre}
              href={`/trending?genre=${encodeURIComponent(genre.toLowerCase())}`}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-300 bg-[#0F1117] border border-white/5 hover:border-[#F27D26]/40 hover:text-white shrink-0 transition-colors"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Popular / Trending Section */}
      {popularList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Komik Populer
                </h2>
                <p className="text-xs text-gray-400">Paling banyak dibaca pembaca Indonesia</p>
              </div>
            </div>
            <Link
              href="/trending"
              className="flex items-center gap-1 text-xs font-semibold text-[#F27D26] hover:text-[#FFA24D] transition-colors"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {popularList.slice(0, 12).map((comic, idx) => (
              <MangaCard key={comic.slug} comic={comic} priority={idx < 6} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Latest Chapter Updates Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Update Terbaru
              </h2>
              <p className="text-xs text-gray-400">Chapter terjemahan Bahasa Indonesia yang baru rilis</p>
            </div>
          </div>
          <Link
            href="/latest"
            className="flex items-center gap-1 text-xs font-semibold text-[#F27D26] hover:text-[#FFA24D] transition-colors"
          >
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {latestData.comics.slice(0, 24).map((comic) => (
            <MangaCard key={comic.slug} comic={comic} />
          ))}
        </div>
      </section>
    </div>
  );
}
