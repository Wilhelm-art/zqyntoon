import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { useBookmarkStore } from '@/store/bookmarkStore';
import { useHistoryStore } from '@/store/historyStore';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
  checkUser: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    set({ user: currentUser, isLoading: false });

    if (currentUser) {
      useBookmarkStore.getState().syncWithCloud();
      useHistoryStore.getState().syncWithCloud();
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user || null;
      set({ user: activeUser });
      if (activeUser) {
        useBookmarkStore.getState().syncWithCloud();
        useHistoryStore.getState().syncWithCloud();
      }
    });
  }
}));