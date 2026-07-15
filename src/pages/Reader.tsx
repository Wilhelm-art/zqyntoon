import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MOCK_PAGES, MOCK_MANGA, MOCK_CHAPTERS } from "../data/mockData";
import { ChevronLeft, Menu, Settings, Columns, AlignJustify } from "lucide-react";
import { cn } from "../lib/utils";

export function Reader() {
  const { slug, chapterId } = useParams();
  const [viewMode, setViewMode] = useState<"vertical" | "paged">("vertical");
  const [currentPage, setCurrentPage] = useState(0);
  const [showNav, setShowNav] = useState(true);

  // In a real app, you would fetch based on chapterId, but for mock we'll just use sl-1
  const pages = MOCK_PAGES["sl-1"] || [];
  const manga = MOCK_MANGA.find(m => m.slug === slug);
  const chapterNumber = chapterId?.replace("chapter-", "");

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (viewMode === "paged") return;
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  if (!manga || pages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 bg-zinc-950 h-screen">
        Chapter not found
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen relative text-zinc-300">
      {/* Top Nav */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 transition-transform duration-300",
          showNav ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/manga/${manga.slug}`} className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-serif italic font-light tracking-tight text-white line-clamp-1 text-lg">{manga.title}</h1>
              <p className="text-[10px] font-mono text-white/40 uppercase">Chapter {chapterNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setViewMode(prev => prev === "vertical" ? "paged" : "vertical");
                setCurrentPage(0);
                window.scrollTo(0,0);
              }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase"
              title="Toggle View Mode"
            >
              {viewMode === "vertical" ? <Columns className="w-4 h-4" /> : <AlignJustify className="w-4 h-4" />}
              <span className="hidden md:inline">{viewMode === "vertical" ? "Paged" : "Vertical"}</span>
            </button>
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reader Area */}
      <div className={cn("mx-auto", viewMode === "vertical" ? "pt-16 pb-32 max-w-3xl" : "h-screen pt-16 pb-16 flex flex-col items-center justify-center")}>
        {viewMode === "vertical" ? (
          <div className="flex flex-col items-center w-full">
            {pages.map((page, index) => (
              <img 
                key={page.id}
                src={page.image_url} 
                alt={`Page ${page.page_number}`}
                className="w-full h-auto"
                loading={index < 3 ? "eager" : "lazy"}
              />
            ))}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
              src={pages[currentPage].image_url} 
              alt={`Page ${pages[currentPage].page_number}`}
              className="max-w-full max-h-full object-contain"
            />
            {/* Click zones for paged mode */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-1/3 cursor-pointer"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            />
            <div 
              className="absolute top-0 bottom-0 right-0 w-1/3 cursor-pointer"
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
            />
          </div>
        )}
      </div>

      {/* Bottom Nav / Progress (Paged Mode) */}
      {viewMode === "paged" && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10 h-16 flex items-center justify-center px-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            Page {currentPage + 1} / {pages.length}
          </div>
        </div>
      )}

      {/* Next Chapter Prompt (Vertical Mode) */}
      {viewMode === "vertical" && (
        <div className="max-w-3xl mx-auto p-8 border-t border-white/10 text-center">
          <p className="mb-4 text-[11px] font-mono text-white/40 uppercase tracking-widest">End of Chapter {chapterNumber}</p>
          <Link 
            to={`/manga/${manga.slug}/chapter-${Number(chapterNumber) + 1}`}
            className="inline-block bg-[#F27D26] hover:bg-[#ff9d5c] text-black font-bold py-3 px-8 rounded-md transition-colors text-sm"
          >
            NEXT CHAPTER
          </Link>
        </div>
      )}
    </div>
  );
}
