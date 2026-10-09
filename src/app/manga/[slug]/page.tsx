import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Star, User, Palette } from "lucide-react";
import { getComicDetail } from "@/lib/scraper/bacakomik";
import { ComicDetailClient } from "@/components/ComicDetailClient";

interface MangaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const comic = await getComicDetail(slug);
    const title = `${comic.title} Bahasa Indonesia`;
    const description = comic.synopsis
      ? comic.synopsis.slice(0, 160)
      : `Baca komik ${comic.title} Bahasa Indonesia terlengkap di ZqynToon.`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zynqtoon.web.id";
    const proxiedCover = comic.cover
      ? `${siteUrl}/api/proxy?url=${encodeURIComponent(comic.cover)}`
      : `${siteUrl}/cover-placeholder.svg`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: [{ url: proxiedCover }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [proxiedCover],
      },
    };
  } catch {
    return {
      title: "Detail Komik | ZqynToon",
    };
  }
}

export default async function MangaDetailPage({ params }: MangaPageProps) {
  const { slug } = await params;

  let comic;
  try {
    comic = await getComicDetail(slug);
  } catch (err) {
    console.error("Failed to fetch comic:", err);
    notFound();
  }

  const proxiedCover = comic.cover
    ? `/api/proxy?url=${encodeURIComponent(comic.cover)}`
    : "/cover-placeholder.svg";

  const typeColor =
    comic.type.toLowerCase() === "manhwa"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
      : comic.type.toLowerCase() === "manhua"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : "bg-orange-500/20 text-orange-300 border-orange-500/30";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicSeries",
    name: comic.title,
    alternateName: comic.alternativeTitle,
    description: comic.synopsis,
    image: proxiedCover,
    genre: comic.genres,
    author: {
      "@type": "Person",
      name: comic.author || "Unknown",
    },
    illustrator: {
      "@type": "Person",
      name: comic.artist || comic.author || "Unknown",
    },
    numberOfEpisodes: comic.chapters.length,
  };

  return (
    <div className="min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero Backdrop with Ambient Glow */}
      <section className="relative w-full overflow-hidden bg-[#0A0C12] border-b border-white/5">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#F27D26]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            {/* Poster Thumbnail */}
            <div className="relative w-44 sm:w-56 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-[#171A23] mx-auto md:mx-0">
              <Image
                src={proxiedCover}
                alt={comic.title}
                fill
                priority
                sizes="(max-width: 640px) 176px, (max-width: 1024px) 224px, 256px"
                quality={80}
                className="object-cover object-top"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg border backdrop-blur-md ${typeColor}`}>
                  {comic.type}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-lg border backdrop-blur-md ${
                    comic.status === "Ongoing"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {comic.status}
                </span>
              </div>
            </div>

            {/* Info & Synopsis */}
            <div className="flex-1 space-y-5 text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {comic.title}
                </h1>
                {comic.alternativeTitle && (
                  <p className="text-gray-400 text-sm mt-1 italic">
                    {comic.alternativeTitle}
                  </p>
                )}
              </div>

              {/* Quick Metadata Grid */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 py-1">
                {comic.rating && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{comic.rating}</span>
                  </div>
                )}
                {comic.author && (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <User className="w-4 h-4 text-[#F27D26]" />
                    <span>Penulis: <strong className="text-gray-200">{comic.author}</strong></span>
                  </div>
                )}
                {comic.artist && (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Palette className="w-4 h-4 text-[#F27D26]" />
                    <span>Artis: <strong className="text-gray-200">{comic.artist}</strong></span>
                  </div>
                )}
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2">
                {comic.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/trending?genre=${encodeURIComponent(g.toLowerCase())}`}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-[#141722] text-gray-300 hover:text-white border border-white/5 hover:border-[#F27D26]/40 transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>

              {/* Synopsis */}
              {comic.synopsis && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                    Sinopsis
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-3xl whitespace-pre-line">
                    {comic.synopsis}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive CTA & Chapter List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <ComicDetailClient comic={comic} />
      </div>
    </div>
  );
}
