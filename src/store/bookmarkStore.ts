import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

export interface BookmarkItem {
  slug: string;
  title: string;
  cover: string;
  type?: string;
  bookmarkedAt: string;
}

interface BookmarkState {
  bookmarks: BookmarkItem[];
  addBookmark: (item: Omit<BookmarkItem, "bookmarkedAt">) => void;
  removeBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  syncWithSupabase: (userId?: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (item) => {
        const newItem: BookmarkItem = {
          ...item,
          bookmarkedAt: new Date().toISOString(),
        };
        set((state) => ({
          bookmarks: [newItem, ...state.bookmarks.filter((b) => b.slug !== item.slug)],
        }));

        // Fire-and-forget sync to Supabase if authenticated
        get().syncWithSupabase();
      },
      removeBookmark: (slug) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.slug !== slug),
        }));
        get().syncWithSupabase();
      },
      isBookmarked: (slug) => {
        return get().bookmarks.some((b) => b.slug === slug);
      },
      syncWithSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          const bookmarks = get().bookmarks;
          if (bookmarks.length === 0) return;

          const rows = bookmarks.map((b) => ({
            user_id: session.user.id,
            comic_slug: b.slug,
            comic_title: b.title,
            cover_url: b.cover,
            comic_type: b.type || "Manga",
          }));

          await supabase.from("bookmarks").upsert(rows, { onConflict: "user_id,comic_slug" });
        } catch {
          // Silent fallback for guest/offline
        }
      },
    }),
    {
      name: "zqyntoon-bookmarks",
    }
  )
);
