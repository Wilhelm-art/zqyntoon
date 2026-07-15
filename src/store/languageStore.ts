import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  lang: 'en' | 'id';
  setLang: (lang: 'en' | 'id') => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'id', // Default language
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'zynqtoon-language', // key for localStorage
    }
  )
);
