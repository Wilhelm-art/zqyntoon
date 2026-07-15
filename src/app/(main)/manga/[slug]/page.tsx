/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { getMangaDetails, getMangaChapters, getCoverUrlWithFallback } from "@/lib/api/mangadex";
import { ChevronRight } from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";
import { useState, useEffect, use } from "react";

export default function Series({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLanguageStore();
  
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [mangaData, rawChapters] = await Promise.all([
          getMangaDetails(slug),
          getMangaChapters(slug, ['en', 'id'])
        ]);
        
        const coverArt = mangaData.relationships.find((r: any) => r.type === 'cover_art');
        const author = mangaData.relationships.find((r: any) => r.type === 'author');
        
        let title = 'Unknown Title';
        if (mangaData.attributes.title) {
            title = mangaData.attributes.title.en || mangaData.attributes.title.id || Object.values(mangaData.attributes.title)[0] || title;
        }
        
        let description = 'No synopsis available.';
        if (mangaData.attributes.description && typeof mangaData.attributes.description === 'object') {
            description = mangaData.attributes.description.en || mangaData.attributes.description.id || Object.values(mangaData.attributes.description)[0] || description;
        }
        
        const genres = mangaData.attributes.tags
          .filter((t: any) => t.attributes.group === 'genre' || t.attributes.group === 'theme')
          .map((t: any) => t.attributes.name.en || Object.values(t.attributes.name)[0])
          .slice(0, 4);

        const coverUrl = await getCoverUrlWithFallback(mangaData.id, coverArt?.attributes?.fileName, title as string);

        setManga({
          id: mangaData.id,
          title,
          slug: mangaData.id,
          cover_url: coverUrl,
          author: author?.attributes?.name || 'Unknown Author',
          rating: null,
          status: mangaData.attributes?.status?.toUpperCase() || 'UNKNOWN',
          genres: genres.length > 0 ? genres : ['Manga'],
          synopsis: description
        });

        // Filter chapters based on current lang state
        const filteredChapters = rawChapters
          .filter((ch: any) => ch.attributes.translatedLanguage === lang)
          .map((ch: any) => {
            const group = ch.relationships.find((r: any) => r.type === 'scanlation_group');
            return {
              id: ch.id,
              chapter_number: ch.attributes.chapter || 'Oneshot',
              title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
              published_at: ch.attributes.readableAt || ch.attributes.publishAt,
              scanlator: group?.attributes?.name || 'Official', 
              views: null
            };
          });

        setChapters(filteredChapters);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [slug, lang]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[50vh] text-white/50">{lang === 'id' ? 'Memuat data manga...' : 'Loading manga data...'}</div>;
  }

  if (!manga) return <div className="text-center py-20 text-white">Manga not found</div>;

  return (
    <main className="flex-1">
      {/* Banner / Cover Section */}
      <section className="relative">
        <div className="h-[40vh] md:h-[50vh] w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-20" />
          <img 
            src={manga.cover_url}
            alt={manga.title}
            className="w-full h-full object-cover object-top opacity-50"
          />
        </div>

        <div className="container mx-auto px-4 relative z-30 -mt-32 md:-mt-48 flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0 shadow-2xl shadow-black rounded-lg overflow-hidden border border-white/10 bg-[#121212]">
            <img 
              src={manga.cover_url}
              alt={manga.title}
              className="w-full h-auto aspect-[2/3] object-cover"
            />
          </div>

          <div className="flex flex-col justify-end pb-4 space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-white">
              {manga.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
              <span className="text-white/80">{manga.author}</span>
              <span className="text-white/40">•</span>
              <span className={manga.status === "ONGOING" ? "text-green-400" : "text-blue-400"}>
                {manga.status}
              </span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {manga.genres.map((genre: string) => (
                <span key={genre} className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link 
                href={chapters.length > 0 ? `/manga/${manga.slug}/chapter-${chapters[chapters.length-1].id}` : '#'}
                className="bg-[#F27D26] hover:bg-[#ff9d5c] text-black text-center px-8 py-3 rounded-md font-bold text-sm transition-colors"
              >
                {lang === 'id' ? 'BACA CHAPTER PERTAMA' : 'READ FIRST CHAPTER'}
              </Link>
              <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-md font-bold text-sm transition-colors opacity-50 cursor-not-allowed pointer-events-none">
                + {lang === 'id' ? 'SIMPAN' : 'WISHLIST'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* Left Column (Synopsis) */}
        <div className="lg:w-1/3">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">
            {lang === 'id' ? 'Sinopsis' : 'Synopsis'}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
            {manga.synopsis}
          </p>
        </div>

        {/* Right Column (Chapters) */}
        <div className="lg:w-2/3">
          <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-2">
            <h3 className="text-lg font-medium text-white">{lang === 'id' ? 'Daftar Chapter' : 'Chapter List'}</h3>
            <span className="text-white/40 text-sm">{chapters.length} Chapters</span>
          </div>

          <div className="space-y-2">
            {chapters.length === 0 ? (
              <p className="text-white/40 text-center py-8">{lang === 'id' ? 'Tidak ada chapter tersedia untuk bahasa ini.' : 'No chapters available in this language.'}</p>
            ) : (
              chapters.map((chapter: any) => (
                <Link 
                  key={chapter.id}
                  href={`/manga/${manga.slug}/chapter-${chapter.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <span className="font-bold text-white group-hover:text-[#F27D26] transition-colors">
                      {lang === 'id' ? 'Chapter' : 'Ch.'} {chapter.chapter_number}
                    </span>
                    {chapter.title && chapter.title !== `Chapter ${chapter.chapter_number}` && (
                      <>
                        <span className="hidden md:inline text-white/20">-</span>
                        <span className="text-white/60 text-sm">{chapter.title}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end text-xs text-white/40">
                      <span>{chapter.scanlator}</span>
                      <span>{new Date(chapter.published_at).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F27D26]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}