import { Flame } from "lucide-react";
import { getPopularComics } from "@/lib/scraper/bacakomik";
import { MangaCard } from "@/components/MangaCard";

export const revalidate = 600;

export default async function TrendingPage() {
  const comics = await getPopularComics().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      <div className="flex items-center gap-3 pb-6 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Komik Terpopuler
          </h1>
          <p className="text-sm text-gray-400">
            Daftar komik manga, manhwa, dan manhua paling ramai dibaca
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {comics.map((comic, idx) => (
          <MangaCard key={comic.slug} comic={comic} priority={idx < 6} />
        ))}
      </div>
    </div>
  );
}
