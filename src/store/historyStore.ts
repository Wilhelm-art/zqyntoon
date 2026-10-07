import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

export interface HistoryItem {
  comicSlug: string;
  comicTitle: string;
  cover: string;
  chapterId: string;
  chapterTitle: string;
  readAt: string;
  progressPercent: number;
}

interface HistoryState {
  history: HistoryItem[];
  saveProgress: (item: Omit<HistoryItem, "readAt">) => void;
  getComicProgress: (comicSlug: string) => HistoryItem | undefined;
  syncWithSupabase: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      saveProgress: (item) => {
        const fullItem: HistoryItem = {
          ...item,
          readAt: new Date().toISOString(),
        };

        set((state) => ({
          history: [fullItem, ...state.history.filter((h) => h.comicSlug !== item.comicSlug)],
        }));

        get().syncWithSupabase();
      },
      getComicProgress: (comicSlug) => {
        return get().history.find((h) => h.comicSlug === comicSlug);
      },
      syncWithSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          const history = get().history;
          if (history.length === 0) return;

          const rows = history.map((h) => ({
            user_id: session.user.id,
            comic_slug: h.comicSlug,
            comic_title: h.comicTitle,
            cover_url: h.cover,
            chapter_id: h.chapterId,
            chapter_title: h.chapterTitle,
            progress: h.progressPercent,
          }));

          await supabase.from("reading_history").upsert(rows, { onConflict: "user_id,comic_slug" });
        } catch {
          // Silent fallback for guest/offline
        }
      },
    }),
    {
      name: "zqyntoon-reading-history",
    }
  )
);
