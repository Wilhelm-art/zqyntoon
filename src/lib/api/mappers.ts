import { getCoverUrlWithFallback, getMangaTitle } from './mangadex';

export interface MangaCardData {
  id: string;
  title: string;
  coverUrl: string | null;
  source: 'mangadex' | 'sansekai' | 'bacakomik';
  rating?: string | number | null;
  follows?: string;
  status?: string;
  type?: string;
  slug?: string;
  synopsis?: string;
  author?: string;
  genres?: string[];
}

/**
 * Standardizes a MangaDex API item into our unified UI object
 */
export const mapMangaDexToCardData = (manga: any): MangaCardData => {
  const title = getMangaTitle(manga);
  const coverArt = manga.relationships?.find((r: any) => r.type === 'cover_art');
  const fileName = coverArt?.attributes?.fileName;
  const coverUrl = getCoverUrlWithFallback(manga.id, fileName);

  return {
    id: manga.id,
    title,
    coverUrl,
    source: 'mangadex',
    status: manga.attributes?.status,
  };
};
