import axios from 'axios';

// Since MangaDex is blocked by internetbaik for standard Telkomsel users,
// but works for users using 1.1.1.1/Google DNS, we proxy the requests through Next.js serverless functions.
// Vercel's Edge/Serverless functions naturally use unrestricted global DNS resolvers, completely bypassing Telkomsel's block.
// This means users don't have to manually configure 1.1.1.1 — it will just work for everyone!

const isClient = typeof window !== 'undefined';
const getBaseUrl = () => {
    if (!isClient) return 'https://api.mangadex.org';
    // When called from browser (client-side), proxy through our API to bypass DNS blocks
    return '/api/proxy?url=' + encodeURIComponent('https://api.mangadex.org');
};

const buildUrl = (path: string) => {
    if (!isClient) return `https://api.mangadex.org${path}`;
    return `/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org${path}`)}`;
}

// Helper function to extract cover art from relationships
export const getCoverUrl = (mangaId: string, fileName?: string) => {
  if (!fileName) return 'https://mangadex.org/title/placeholder.png'; // Fallback
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
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

  const response = await fetch(buildUrl(`/manga?${params.toString()}`));
  const data = await response.json();
  return data.data;
};

export const getMangaDetails = async (id: string) => {
  const params = new URLSearchParams();
  ['cover_art', 'author', 'artist'].forEach(inc => params.append('includes[]', inc));

  const response = await fetch(buildUrl(`/manga/${id}?${params.toString()}`));
  const data = await response.json();
  return data.data;
};

export const getMangaChapters = async (id: string, languages = ['en', 'id']) => {
  const params = new URLSearchParams();
  languages.forEach(lang => params.append('translatedLanguage[]', lang));
  params.append('order[chapter]', 'desc');
  params.append('includes[]', 'scanlation_group');
  params.append('limit', '500'); 

  const response = await fetch(buildUrl(`/manga/${id}/feed?${params.toString()}`));
  const data = await response.json();
  return data.data;
};

export const getChapterPages = async (chapterId: string) => {
  const response = await fetch(buildUrl(`/at-home/server/${chapterId}`));
  const data = await response.json();
  const baseUrl = data.baseUrl;
  const hash = data.chapter.hash;
  const pages = data.chapter.data; 
  
  return pages.map((page: string) => `${baseUrl}/data/${hash}/${page}`);
};

export const searchManga = async (title: string) => {
  const params = new URLSearchParams();
  params.append('title', title);
  params.append('includes[]', 'cover_art');
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');

  const response = await fetch(buildUrl(`/manga?${params.toString()}`));
  const data = await response.json();
  return data.data;
};
