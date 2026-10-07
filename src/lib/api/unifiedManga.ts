import { getPopularComics, getLatestComics, getManhwaComics } from '@/lib/scraper/bacakomik';
import { MangaCardData } from './mappers';
import { getMangaList, getCoverUrlWithFallback, getMangaTitle } from './mangadex';

export const getHomepageData = async () => {
  // 1. Fetch Indonesian comics from Bacakomik as Primary Source
  let idPopular: MangaCardData[] = [];
  let idLatest: MangaCardData[] = [];
  let idManhwa: MangaCardData[] = [];

  try {
    [idPopular, idLatest, idManhwa] = await Promise.all([
      getPopularComics(),
      getLatestComics(),
      getManhwaComics(),
    ]);
  } catch (error) {
    console.error('Failed to load Indonesian comics from primary scraper:', error);
  }

  // 2. Fetch MangaDex as secondary fallback only if Indonesian sources are empty
  let mdxTrending: any[] = [];
  let mdxLatest: any[] = [];
  let mdxPopular: any[] = [];

  if (idPopular.length === 0 || idLatest.length === 0) {
    try {
      [mdxTrending, mdxLatest, mdxPopular] = await Promise.all([
        getMangaList({ limit: 12 }),
        getMangaList({ limit: 12, offset: 12 }),
        getMangaList({ limit: 6, offset: 24 }),
      ]);
    } catch (e) {
      console.error('MangaDex fallback error:', e);
    }
  }

  const mapMDX = (mdData: any[]): MangaCardData[] => {
    return mdData.map((m: any) => {
      const coverArt = m.relationships?.find((r: any) => r.type === 'cover_art');
      const author = m.relationships?.find((r: any) => r.type === 'author');
      
      const title = getMangaTitle(m);
      
      let description = `Komik ${title} bahasa Indonesia update terbaru di ZynqToon.`;
      if (m.attributes?.description && typeof m.attributes.description === 'object') {
        description = m.attributes.description.id || m.attributes.description.en || Object.values(m.attributes.description)[0] || description;
      }
      
      const genres = (m.attributes?.tags ?? [])
        .filter((t: any) => t.attributes?.group === 'genre' || t.attributes?.group === 'theme')
        .map((t: any) => t.attributes?.name?.en || Object.values(t.attributes?.name ?? {})[0])
        .slice(0, 3);
        
      const coverUrl = getCoverUrlWithFallback(m.id, coverArt?.attributes?.fileName);
        
      return {
        id: m.id,
        title,
        slug: m.id, 
        coverUrl,
        source: 'mangadex',
        author: author?.attributes?.name || 'Unknown Author', 
        rating: null,
        status: m.attributes?.status?.toUpperCase() || 'UNKNOWN',
        genres: genres.length > 0 ? genres : ['Manga'],
        synopsis: description
      };
    });
  };

  const mdxMappedTrending = mapMDX(mdxTrending);
  const mdxMappedLatest = mapMDX(mdxLatest);
  const mdxMappedPopular = mapMDX(mdxPopular);

  // Prioritize Indonesian comics for all main shelves:
  const trending = idPopular.length > 0 ? idPopular.slice(0, 12) : mdxMappedTrending;
  const latest = idLatest.length > 0 ? idLatest.slice(0, 12) : mdxMappedLatest;
  const hero = idPopular.length > 0 ? idPopular.slice(0, 6) : mdxMappedPopular;
  const idRecommended = idManhwa.length > 0 ? idManhwa.slice(0, 10) : (idPopular.slice(6, 16).length > 0 ? idPopular.slice(6, 16) : trending);
  const idLatestShelf = idLatest.length > 0 ? idLatest.slice(0, 10) : latest;

  return {
    hero,
    trending,
    latest,
    idRecommended,
    idLatest: idLatestShelf,
  };
};
