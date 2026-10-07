import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReadingMode = "webtoon" | "paged";
export type ImageWidth = "narrow" | "default" | "full";

interface ReaderState {
  readingMode: ReadingMode;
  imageWidth: ImageWidth;
  brightness: number; // 50 to 100
  showOverlay: boolean;
  setReadingMode: (mode: ReadingMode) => void;
  setImageWidth: (width: ImageWidth) => void;
  setBrightness: (brightness: number) => void;
  toggleOverlay: () => void;
  setShowOverlay: (show: boolean) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      readingMode: "webtoon",
      imageWidth: "default",
      brightness: 100,
      showOverlay: true,
      setReadingMode: (readingMode) => set({ readingMode }),
      setImageWidth: (imageWidth) => set({ imageWidth }),
      setBrightness: (brightness) => set({ brightness }),
      toggleOverlay: () => set((state) => ({ showOverlay: !state.showOverlay })),
      setShowOverlay: (showOverlay) => set({ showOverlay }),
    }),
    {
      name: "zqyntoon-reader-settings",
    }
  )
);
