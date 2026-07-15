import Link from "next/link";
import { getMangaDetails, getMangaChapters, getCoverUrl } from "@/lib/api/mangadex";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string, lang: string }> }): Promise<Metadata> {
  const { slug, lang } = await params;
  
  try {
    const m = await getMangaDetails(slug);
    const titleKey = Object.keys(m.attributes.title)[0];
    const title = m.attributes.title.en || m.attributes.title[titleKey];
    
    const descKey = m.attributes.description ? Object.keys(m.attributes.description)[0] : null;
    const description = descKey ? (m.attributes.description.en || m.attributes.description[descKey]) : "No synopsis available.";
    
    const coverArt = m.relationships.find((r: any) => r.type === "cover_art");
    
    return {
      title: `${title} - ${lang === "en" ? "Read Online" : "Baca Online"}`,
      description: description,
      openGraph: {
        images: [getCoverUrl(m.id, coverArt?.attributes?.fileName)]
      }
    };
  } catch (e) {
    return { title: "Not Found" };
  }
}

export default async function Series({ params }: { params: Promise<{ slug: string, lang: string }> }) {
  const { slug, lang } = await params;
  
  try {
    const rawManga = await getMangaDetails(slug);
    
    // MangaDex uses an array of languages for fallback filtering. 
    // We prioritize the requested locale (lang), then fallback to "en".
    const targetLanguages = lang === "id" ? ["id", "en"] : ["en", "id"];
    const rawChapters = await getMangaChapters(slug, targetLanguages);
    
    const titleKey = Object.keys(rawManga.attributes.title)[0];
    const title = rawManga.attributes.title.en || rawManga.attributes.title[titleKey];
    
    const descKey = rawManga.attributes.description ? Object.keys(rawManga.attributes.description)[0] : null;
    const description = descKey ? (rawManga.attributes.description.en || rawManga.attributes.description[descKey]) : "No synopsis available.";
    
    const coverArt = rawManga.relationships.find((r: any) => r.type === "cover_art");
    const authorRel = rawManga.relationships.find((r: any) => r.type === "author");
    
    const genres = rawManga.attributes.tags
      .filter((t: any) => t.attributes.group === "genre" || t.attributes.group === "theme")
      .map((t: any) => t.attributes.name.en);
      
    const manga = {
      id: rawManga.id,
      title: title,
      slug: rawManga.id,
      cover_url: getCoverUrl(rawManga.id, coverArt?.attributes?.fileName),
      author: authorRel ? "Unknown Author" : "Various",
      rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
      status: rawManga.attributes.status.toUpperCase(),
      genres: genres.length > 0 ? genres : ["Manga"],
      synopsis: description
    };
    
    // Sort chapters by chapter number descending
    const chapters = rawChapters
      .filter((c: any) => c.attributes.chapter != null)
      .map((c: any) => ({
        id: c.id,
        chapter_number: c.attributes.chapter,
        title: c.attributes.title || `Chapter ${c.attributes.chapter}`,
        release_date: c.attributes.readableAt,
        language: c.attributes.translatedLanguage
      }))
      .sort((a: any, b: any) => Number(b.chapter_number) - Number(a.chapter_number));

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
            {/* Cover and Quick Stats */}
            <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6 bg-[#1a1a1a]">
                <img src={manga.cover_url} alt={manga.title} className="w-full h-full object-cover" />
              </div>
              
              <Link 
                href={chapters.length > 0 ? `/${lang}/manga/${manga.slug}/chapter-${chapters[chapters.length-1].id}` : "#"}
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
                {manga.genres.map((genre: string) => (
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
                    chapters.map((chapter: any) => (
                      <Link 
                        key={chapter.id} 
                        href={`/${lang}/manga/${manga.slug}/chapter-${chapter.id}`}
                        className="group flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-sm text-white group-hover:text-[#F27D26] transition-colors">
                            {chapter.title} (Ch. {chapter.chapter_number})
                          </span>
                          <span className="px-2 py-0.5 text-[10px] uppercase rounded-sm bg-white/10 text-white/60">{chapter.language}</span>
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
  } catch (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        Error loading series data.
      </div>
    );
  }
}
