"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, BookOpen, Star } from "lucide-react";
import type { ComicItem } from "@/lib/scraper/bacakomik";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/id-scraper/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.comics || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/5 bg-[#171A23]">
          <Search className="w-5 h-5 text-gray-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari komik (contoh: Solo Leveling, One Piece, Jujutsu Kaisen)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-base sm:text-lg"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-[#F27D26] animate-spin shrink-0 ml-2" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="ml-3 px-2.5 py-1 text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 rounded-md border border-white/10"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 divide-y divide-white/5">
          {results.length > 0 ? (
            results.map((comic) => {
              const proxiedCover = comic.cover
                ? `/api/proxy?url=${encodeURIComponent(comic.cover)}`
                : "/cover-placeholder.svg";

              return (
                <Link
                  key={comic.slug}
                  href={`/manga/${comic.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[#1E222D] shrink-0 border border-white/5">
                    <Image
                      src={proxiedCover}
                      alt={comic.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-100 group-hover:text-[#F27D26] transition-colors truncate">
                      {comic.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {comic.type && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase font-medium">
                          {comic.type}
                        </span>
                      )}
                      {comic.latestChapter && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#F27D26]" />
                          {comic.latestChapter}
                        </span>
                      )}
                      {comic.rating && (
                        <span className="text-xs text-amber-300 flex items-center gap-1 ml-auto">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {comic.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : query && !loading ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">Tidak ditemukan komik dengan judul &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs">
              Ketik minimal 2 karakter untuk mencari komik Bahasa Indonesia
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
