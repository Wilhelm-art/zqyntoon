import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MangaCardData } from '@/lib/api/mappers';
import { createClient } from '@/lib/supabase/client';

interface BookmarkStore {
  bookmarks: MangaCardData[];
  addBookmark: (manga: MangaCardData) => void;
  removeBookmark: (mangaId: string) => void;
  isBookmarked: (mangaId: string) => boolean;
  syncWithCloud: () => Promise<void>;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (manga) => {
        set((state) => {
          if (state.bookmarks.some(b => b.id === manga.id)) return state;
          return { bookmarks: [...state.bookmarks, manga] };
        });

        // Background cloud sync if user is logged in
        if (typeof window !== 'undefined') {
          try {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user?.id) {
                supabase.from('bookmarks').upsert({
                  user_id: session.user.id,
                  manga_id: manga.id,
                  manga_title: manga.title,
                  manga_slug: manga.slug || manga.id,
                  cover_url: manga.coverUrl,
                  source: manga.source || 'mangadex',
                  author: manga.author || null,
                  status: manga.status || null,
                }, { onConflict: 'user_id,manga_id' }).then(({ error }) => {
                  if (error) console.warn('Supabase bookmark sync error:', error.message);
                });
              }
            });
          } catch (e) {
            console.error('Bookmark cloud sync failed:', e);
          }
        }
      },
      removeBookmark: (mangaId) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter(b => b.id !== mangaId)
        }));

        // Background cloud deletion if user is logged in
        if (typeof window !== 'undefined') {
          try {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user?.id) {
                supabase.from('bookmarks')
                  .delete()
                  .match({ user_id: session.user.id, manga_id: mangaId })
                  .then(({ error }) => {
                    if (error) console.warn('Supabase bookmark delete error:', error.message);
                  });
              }
            });
          } catch (e) {
            console.error('Bookmark cloud delete failed:', e);
          }
        }
      },
      isBookmarked: (mangaId) => {
        return get().bookmarks.some(b => b.id === mangaId);
      },
      syncWithCloud: async () => {
        if (typeof window === 'undefined') return;
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;

          const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data && Array.isArray(data)) {
            const cloudBookmarks: MangaCardData[] = data.map((item: any) => ({
              id: item.manga_id,
              title: item.manga_title,
              slug: item.manga_slug,
              coverUrl: item.cover_url,
              source: item.source,
              author: item.author,
              status: item.status,
            }));

            // Merge with local bookmarks avoiding duplicates
            const current = get().bookmarks;
            const merged = [...cloudBookmarks];
            for (const local of current) {
              if (!merged.some(m => m.id === local.id)) {
                merged.push(local);
              }
            }
            set({ bookmarks: merged });
          }
        } catch (err) {
          console.warn('Failed to fetch cloud bookmarks:', err);
        }
      }
    }),
    {
      name: 'zynqtoon-bookmarks',
    }
  )
);
