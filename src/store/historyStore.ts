import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface HistoryItem {
  mangaId: string;
  mangaTitle: string;
  mangaSlug: string;
  chapterId: string;
  chapterNumber: string;
  source: 'mangadex' | 'sansekai' | 'bacakomik';
  lastReadAt: number; // timestamp
}

interface HistoryStore {
  history: Record<string, HistoryItem>;
  addHistory: (item: Omit<HistoryItem, 'lastReadAt'>) => void;
  getHistory: (mangaId: string) => HistoryItem | undefined;
  getAllHistory: () => HistoryItem[];
  syncWithCloud: () => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      history: {},
      addHistory: (item) => {
        const now = Date.now();
        set((state) => ({
          history: {
            ...state.history,
            [item.mangaId]: {
              ...item,
              lastReadAt: now,
            }
          }
        }));

        // Background cloud sync to Supabase reading_history table
        if (typeof window !== 'undefined') {
          try {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user?.id) {
                supabase.from('reading_history').upsert({
                  user_id: session.user.id,
                  manga_id: item.mangaId,
                  manga_title: item.mangaTitle,
                  manga_slug: item.mangaSlug || item.mangaId,
                  chapter_id: item.chapterId,
                  chapter_number: item.chapterNumber,
                  source: item.source || 'mangadex',
                  last_read_at: new Date(now).toISOString(),
                }, { onConflict: 'user_id,manga_id' }).then(({ error }) => {
                  if (error) console.warn('Supabase history sync error:', error.message);
                });
              }
            });
          } catch (e) {
            console.error('History cloud sync failed:', e);
          }
        }
      },
      getHistory: (mangaId) => get().history[mangaId],
      getAllHistory: () => {
        return Object.values(get().history).sort((a, b) => b.lastReadAt - a.lastReadAt);
      },
      syncWithCloud: async () => {
        if (typeof window === 'undefined') return;
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;

          const { data, error } = await supabase
            .from('reading_history')
            .select('*')
            .order('last_read_at', { ascending: false });

          if (error) throw error;

          if (data && Array.isArray(data)) {
            const current = { ...get().history };
            for (const row of data) {
              const cloudTimestamp = new Date(row.last_read_at).getTime();
              const existing = current[row.manga_id];
              if (!existing || existing.lastReadAt < cloudTimestamp) {
                current[row.manga_id] = {
                  mangaId: row.manga_id,
                  mangaTitle: row.manga_title,
                  mangaSlug: row.manga_slug,
                  chapterId: row.chapter_id,
                  chapterNumber: row.chapter_number,
                  source: row.source,
                  lastReadAt: cloudTimestamp,
                };
              }
            }
            set({ history: current });
          }
        } catch (err) {
          console.warn('Failed to fetch cloud history:', err);
        }
      }
    }),
    {
      name: 'zynqtoon-history',
    }
  )
);
