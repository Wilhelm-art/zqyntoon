import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReadingMode = "webtoon" | "paged";
export type ImageWidth = "narrow" | "default" | "full";

interface ReaderState {
  readingMode: ReadingMode;
  imageWidth: ImageWidth;
  setReadingMode: (mode: ReadingMode) => void;
  setImageWidth: (width: ImageWidth) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      readingMode: "webtoon",
      imageWidth: "default",
      setReadingMode: (readingMode) => set({ readingMode }),
      setImageWidth: (imageWidth) => set({ imageWidth }),
    }),
    {
      name: "zqyntoon-reader-settings",
    }
  )
);
