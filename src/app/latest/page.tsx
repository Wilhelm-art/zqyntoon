import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getLatestComics } from "@/lib/scraper/bacakomik";
import { MangaCard } from "@/components/MangaCard";

interface LatestPageProps {
  searchParams: Promise<{ page?: string }>;
}

export const revalidate = 300;

export default async function LatestPage({ searchParams }: LatestPageProps) {
  const { page: pageQuery } = await searchParams;
  const page = Math.max(1, parseInt(pageQuery || "1", 10));

  const { comics, hasNextPage } = await getLatestComics(page).catch(() => ({
    comics: [],
    hasNextPage: false,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      <div className="flex items-center gap-3 pb-6 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Rilis Chapter Terbaru
          </h1>
          <p className="text-sm text-gray-400">
            Pembaruan komik Bahasa Indonesia terkini (Halaman {page})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {comics.map((comic) => (
          <MangaCard key={comic.slug} comic={comic} />
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-4 pt-8">
        {page > 1 && (
          <Link
            href={`/latest?page=${page - 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F1117] border border-white/10 hover:border-white/20 text-sm font-semibold text-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </Link>
        )}

        <span className="text-sm text-gray-400 font-medium">Halaman {page}</span>

        {hasNextPage && (
          <Link
            href={`/latest?page=${page + 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F27D26] text-black hover:bg-[#FFA24D] text-sm font-bold shadow-md"
          >
            Selanjutnya
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
