import { MANGA } from '@consumet/extensions';

// Initialize the provider. You can switch to MangaHere, MangaDex etc if needed.
const provider = new MANGA.MangaKakalot();

export async function searchMangaEN(title: string) {
  try {
    const res = await provider.search(title);
    return res.results; // array of { id, title, image, ... }
  } catch (error) {
    console.error("Consumet search error:", error);
    return [];
  }
}

export async function getChaptersEN(mangaId: string) {
  try {
    const res = await provider.fetchMangaInfo(mangaId);
    return res.chapters; // array of { id, title, chapterNumber, ... }
  } catch (error) {
    console.error("Consumet chapters error:", error);
    return [];
  }
}

export async function getPagesEN(chapterId: string) {
  try {
    const res = await provider.fetchChapterPages(chapterId);
    return res; // array of { page, img, ... }
  } catch (error) {
    console.error("Consumet pages error:", error);
    return [];
  }
}
