/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

const isClient = typeof window !== 'undefined';

/**
 * Build a proxied URL for MangaDex API requests.
 * On the server, fetches MangaDex directly.
 * On the client, routes through /api/proxy to avoid CORS.
 */
const buildApiUrl = (path: string): string => {
  if (!isClient) return `https://api.mangadex.org${path}`;
  return `/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org${path}`)}`;
};

/**
 * Build a proxied URL for MangaDex uploads (cover images).
 * Always routes through /api/proxy so the server fetches with proper
 * Referer/Origin headers, bypassing any CDN hotlink restrictions.
 */
const buildCoverProxyUrl = (path: string): string => {
  return `/api/proxy?url=${encodeURIComponent(`https://uploads.mangadex.org${path}`)}`;
};

/**
 * Returns a proxied cover URL for a manga.
 * Uses MangaDex cover art filename tied to the specific manga ID.
 * Routes through /api/proxy to handle Referer requirements.
 *
 * Thumbnail sizes:
 *   .256.jpg = 256px wide
 *   .512.jpg = 512px wide
 *   (no suffix) = original full size
 */
export const getCoverUrl = (mangaId: string, fileName?: string | null): string | null => {
  if (!fileName) return null;
  // Use .512.jpg thumbnail — correct per MangaDex API docs
  return buildCoverProxyUrl(`/covers/${mangaId}/${fileName}.512.jpg`);
};

/**
 * Returns a cover URL or the placeholder SVG.
 * Guaranteed to return a non-null string.
 */
export const getCoverUrlWithFallback = (mangaId: string, fileName?: string | null): string => {
  return getCoverUrl(mangaId, fileName) ?? '/cover-placeholder.svg';
};

export const getMangaList = async ({ limit = 20, offset = 0, includes = ['cover_art', 'author'] }) => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  includes.forEach(inc => params.append('includes[]', inc));
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('availableTranslatedLanguage[]', 'en');
  params.append('availableTranslatedLanguage[]', 'id');
  params.append('order[followedCount]', 'desc');

  const response = await fetch(buildApiUrl(`/manga?${params.toString()}`));
  const data = await response.json();
  return data.data ?? [];
};

// MangaDex tag UUID map for genres
export const GENRE_TAG_MAP: Record<string, string> = {
  'action':        '391b0423-d847-456f-aff0-8b0cfc03066b',
  'adventure':     '87cc87cd-a395-47af-b27a-93258283bbc6',
  'comedy':        '4d32cc48-9f00-4cca-9b5a-a839f0764984',
  'drama':         'b9af3a63-f058-46de-a9a0-e0c13906197a',
  'fantasy':       'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
  'horror':        'cdad7e68-1419-41dd-bdce-27753074a640',
  'mystery':       'ee968100-4191-4968-93d3-f82d72be7e46',
  'psychological': '3b60b75c-a2d7-4860-ab56-05f391bb889c',
  'romance':       '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
  'sci-fi':        '256c8bd9-4904-4360-bf4f-508a76d67183',
  'slice-of-life': 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9',
  'supernatural':  'eabc5b4c-6aff-42f3-b657-3e90cbd00b75',
  'historical':    '33771934-028e-4cb3-8744-691e866a923e',
  'mecha':         'a1f53773-c69a-4ce5-8cab-fffcd90b1565',
  'sports':        '69964a64-2f90-4d33-beeb-f3ed2875eb4c',
  'isekai':        'ace04997-f6bd-436e-b261-779182193d3d',
};

export const getMangaByTag = async ({
  tagId,
  limit = 30,
  offset = 0,
  includes = ['cover_art', 'author'],
}: {
  tagId: string;
  limit?: number;
  offset?: number;
  includes?: string[];
}) => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  includes.forEach(inc => params.append('includes[]', inc));
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('availableTranslatedLanguage[]', 'en');
  params.append('availableTranslatedLanguage[]', 'id');
  params.append('includedTags[]', tagId);
  params.append('order[followedCount]', 'desc');

  const response = await fetch(buildApiUrl(`/manga?${params.toString()}`));
  const data = await response.json();
  return data.data ?? [];
};

export const getMangaDetails = async (id: string) => {
  const params = new URLSearchParams();
  ['cover_art', 'author', 'artist'].forEach(inc => params.append('includes[]', inc));

  const response = await fetch(buildApiUrl(`/manga/${id}?${params.toString()}`));
  const data = await response.json();
  return data.data;
};

export const getMangaChapters = async (id: string, languages = ['en', 'id']) => {
  const params = new URLSearchParams();
  languages.forEach(lang => params.append('translatedLanguage[]', lang));
  params.append('order[chapter]', 'desc');
  params.append('includes[]', 'scanlation_group');
  params.append('limit', '500');

  const response = await fetch(buildApiUrl(`/manga/${id}/feed?${params.toString()}`));
  const data = await response.json();

  const chapters = data.data ?? [];
  // Filter out external chapters (Manga Plus, Shonen Jump, etc.) — no pages on MangaDex
  return chapters.filter((ch: any) => !ch.attributes?.externalUrl);
};

/**
 * Fetch chapter pages from MangaDex at-home server.
 * Returns array of full image URLs for this chapter.
 * Note: images are served directly from MangaDex CDN (no proxy needed for <img> tags).
 */
export const getChapterPages = async (chapterId: string): Promise<string[]> => {
  const response = await fetch(buildApiUrl(`/at-home/server/${chapterId}`));

  if (!response.ok) {
    throw new Error(`at-home server error: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.result === 'error') {
    const detail = data.errors?.[0]?.detail ?? 'Chapter unavailable';
    throw new Error(detail);
  }

  if (!data.baseUrl || !data.chapter?.hash || !Array.isArray(data.chapter?.data)) {
    throw new Error('Invalid chapter data received from server');
  }

  const baseUrl: string = data.baseUrl;
  const hash: string = data.chapter.hash;
  const pages: string[] = data.chapter.data;

  // Route through /api/proxy — Vercel server fetches from MangaDex CDN directly,
  // bypassing Indonesian ISP DNS blocking (Telkomsel internetbaik, Indihome, etc.)
  return pages.map((page) => {
    const directUrl = `${baseUrl}/data/${hash}/${page}`;
    return `/api/proxy?url=${encodeURIComponent(directUrl)}`;
  });
};

export const searchManga = async (title: string) => {
  const params = new URLSearchParams();
  params.append('title', title);
  params.append('includes[]', 'cover_art');
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');

  const response = await fetch(buildApiUrl(`/manga?${params.toString()}`));
  const data = await response.json();
  return data.data ?? [];
};
