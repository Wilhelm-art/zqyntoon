"use client";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useHistoryStore } from "@/store/historyStore";
import { useLanguageStore } from "@/store/languageStore";
import { useAuthStore } from "@/store/authStore";
import { MangaCard } from "@/components/MangaCard";
import Link from "next/link";
import { useState } from "react";
import { Trash2, Bookmark, History, RotateCw, ArrowRight } from "lucide-react";

export default function Bookmarks() {
  const { lang } = useLanguageStore();
  const { user } = useAuthStore();
  const { bookmarks, removeBookmark, syncWithCloud: syncBookmarks } = useBookmarkStore();
  const { getAllHistory, syncWithCloud: syncHistory } = useHistoryStore();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const historyItems = getAllHistory();

  const handleManualSync = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      await Promise.all([syncBookmarks(), syncHistory()]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[#F27D26] text-[10px] font-bold tracking-widest uppercase block mb-1">
            {lang === 'id' ? 'Perpustakaan Pribadi' : 'Personal Library'}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif italic font-normal tracking-tight text-white">
            {lang === 'id' ? 'Koleksi Saya' : 'My Collection'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {user && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-2 text-white/50 hover:text-[#F27D26] transition-colors rounded-lg border border-white/10 hover:border-[#F27D26]/40 text-xs flex items-center gap-1.5"
              title="Sinkronisasi Cloud"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#F27D26]' : ''}`} />
              <span className="hidden sm:inline">{lang === 'id' ? 'Sinkron' : 'Sync'}</span>
            </button>
          )}

          <div className="flex bg-[#111115] p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setActiveTab('bookmarks')}
              className={`px-5 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
                activeTab === 'bookmarks' 
                  ? 'bg-[#F27D26] text-black shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Tersimpan' : 'Bookmarks'} ({bookmarks.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-[#F27D26] text-black shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Riwayat' : 'History'} ({historyItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'bookmarks' ? (
        bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#111115] border border-white/10 flex items-center justify-center text-[#F27D26] mb-5 shadow-inner">
              <Bookmark className="w-8 h-8 opacity-70" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">{lang === 'id' ? 'Belum Ada yang Disimpan' : 'No Bookmarks Yet'}</h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              {lang === 'id' 
                ? 'Simpan komik favorit Anda untuk menerima pembaruan dan membacanya kapan saja.' 
                : 'Bookmark your favorite manga to easily access them and track updates.'}
            </p>
            <Link 
              href="/" 
              className="bg-[#F27D26] hover:bg-[#ff9447] text-black font-bold px-6 py-2.5 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <span>{lang === 'id' ? 'Eksplor Manga' : 'Explore Manga'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {bookmarks.map((manga, i) => (
              <div key={`${manga.id}-${i}`} className="relative group">
                <MangaCard manga={{...manga, cover_url: manga.coverUrl}} lang={lang} />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeBookmark(manga.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-[#070709]/90 backdrop-blur-md rounded-full text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-20 border border-white/10"
                  title={lang === 'id' ? 'Hapus Bookmark' : 'Remove Bookmark'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#111115] border border-white/10 flex items-center justify-center text-[#F27D26] mb-5 shadow-inner">
              <History className="w-8 h-8 opacity-70" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">{lang === 'id' ? 'Belum Ada Riwayat Baca' : 'No Reading History'}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {lang === 'id' 
                ? 'Riwayat membaca akan otomatis tersimpan di sini saat Anda membuka chapter.' 
                : 'Your reading progress will be saved automatically as you read chapters.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {historyItems.map((item, i) => (
              <div 
                key={`${item.mangaId}-${i}`}
                className="flex items-center justify-between p-4 bg-[#111115] rounded-xl border border-white/10 hover:border-white/20 transition-colors group"
              >
                <div className="flex flex-col">
                  <Link 
                    href={item.source === 'sansekai' ? `/manga/${item.mangaId}?source=sansekai` : `/manga/${item.mangaSlug || item.mangaId}`}
                    className="font-semibold text-[#EDEDED] group-hover:text-[#F27D26] transition-colors text-sm sm:text-base"
                  >
                    {item.mangaTitle}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[11px] text-zinc-300">Ch. {item.chapterNumber}</span>
                    <span>•</span>
                    <span className="text-[11px]">
                      {new Date(item.lastReadAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/manga/${item.mangaSlug || item.mangaId}/chapter-${item.chapterId}`}
                  className="px-4 py-2 bg-white/5 hover:bg-[#F27D26] hover:text-black border border-white/10 hover:border-[#F27D26] rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  <span>{lang === 'id' ? 'LANJUT BACA' : 'CONTINUE'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )
      )}
    </main>
  );
}
