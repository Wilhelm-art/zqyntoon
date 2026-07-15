import { getMangaList, getCoverUrl } from "@/lib/api/mangadex";
import { MangaCard } from "@/components/MangaCard";
import Link from "next/link";

// Map MangaDex API format to our internal Manga format
const mapMangaDexData = (mdData: any) => {
  if (!mdData || !Array.isArray(mdData)) return [];
  
  return mdData.map((m: any) => {
    const coverArt = m.relationships.find((r: any) => r.type === 'cover_art');
    const author = m.relationships.find((r: any) => r.type === 'author');
    
    // Safely parse title falling back to any available localized object keys
    let title = 'Unknown Title';
    if (m.attributes.title) {
        title = m.attributes.title.en || m.attributes.title.id || Object.values(m.attributes.title)[0] || title;
    }
    
    let description = 'No synopsis available.';
    if (m.attributes.description && typeof m.attributes.description === 'object') {
        description = m.attributes.description.en || m.attributes.description.id || Object.values(m.attributes.description)[0] || description;
    }
    
    const genres = m.attributes.tags
      .filter((t: any) => t.attributes.group === 'genre' || t.attributes.group === 'theme')
      .map((t: any) => t.attributes.name.en || Object.values(t.attributes.name)[0])
      .slice(0, 3);
      
    return {
      id: m.id,
      title: title,
      slug: m.id, 
      cover_url: getCoverUrl(m.id, coverArt?.attributes?.fileName),
      author: author ? 'Unknown Author' : 'Various', 
      rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
      status: m.attributes?.status?.toUpperCase() || 'UNKNOWN',
      genres: genres.length > 0 ? genres : ['Manga'],
      synopsis: description
    };
  });
};

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  // Fetch real data from MangaDex
  // We use different offsets to mock 'Trending' vs 'Latest' for now
  const rawTrending = await getMangaList({ limit: 10, offset: 0 });
  const rawLatest = await getMangaList({ limit: 10, offset: 20 });
  
  const trendingManga = mapMangaDexData(rawTrending);
  const latestManga = mapMangaDexData(rawLatest);
  
  const heroManga = trendingManga.length > 0 ? trendingManga[0] : null;

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      {/* Hero Section */}
      {heroManga && (
        <section className="mb-12">
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[21/7] bg-[#121212]">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
            <img 
              src={heroManga.cover_url} 
              alt="Hero Banner" 
              className="absolute right-0 top-0 w-2/3 h-full object-cover opacity-50"
            />
            <div className="relative z-20 h-full flex flex-col justify-center p-6 md:p-10 w-full md:w-2/3 space-y-3">
              <div className="flex gap-2 mb-2">
                <span className="bg-[#F27D26] text-black text-[10px] font-bold px-2 py-0.5 rounded">TRENDING #1</span>
                {heroManga.genres[0] && (
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {heroManga.genres[0]}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white line-clamp-1">
                {heroManga.title}
              </h1>
              <p className="text-sm text-white/60 line-clamp-2 italic mb-4">
                {heroManga.synopsis}
              </p>
              <div className="flex gap-4 pt-2">
                <Link href={`/${lang}/manga/${heroManga.slug}`} className="bg-white text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-zinc-200 transition-colors">
                  START READING
                </Link>
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors">
                  + WISHLIST
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-medium tracking-tight text-white">Trending Now</h2>
          <a href="#" className="text-[#F27D26] text-xs font-semibold hover:underline">VIEW ALL</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {trendingManga.map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
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
          {latestManga.map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} lang={lang} />
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
