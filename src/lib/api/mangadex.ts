import axios from 'axios';
import https from 'https';

// Vercel serverless edge functions naturally bypass local Indonesian ISP (Telkomsel) DNS spoofing 
// because they run on AWS/Vercel datacenters with their own global DNS resolvers (like 1.1.1.1).
// However, when users fetch client-side, we must route them through a clean proxy or strictly rely on SSR
// Right now, we fetch client-side in useEffect, which exposes Indonesian users to Telkomsel's internetbaik block.

// The solution:
// 1. Force the baseUrl to use Vercel's backend as a proxy if we wanted client-side, OR
// 2. We can use Cloudflare's 1.1.1.1 DoH (DNS over HTTPS) resolver, but browsers don't allow custom DNS for fetch().
// 3. MangaDex officially recommends using their CORS proxy or keeping requests server-side.

// Since the user asked to "let it run if visitors to my website use Cloudflare (1.1.1.1) or Google (Public DNS)"
// I will keep the direct API endpoint, but remove the insecure `rejectUnauthorized: false` hack which was masking the error,
// and let the browser's native DNS resolution handle it. If they have 1.1.1.1 configured, it will work natively.

const api = axios.create({
  baseURL: 'https://api.mangadex.org',
});

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

  const { data } = await api.get(`/manga?${params.toString()}`);
  return data.data;
};

export const getMangaDetails = async (id: string) => {
  const params = new URLSearchParams();
  ['cover_art', 'author', 'artist'].forEach(inc => params.append('includes[]', inc));

  const { data } = await api.get(`/manga/${id}?${params.toString()}`);
  return data.data;
};

export const getMangaChapters = async (id: string, languages = ['en', 'id']) => {
  const params = new URLSearchParams();
  languages.forEach(lang => params.append('translatedLanguage[]', lang));
  params.append('order[chapter]', 'desc');
  params.append('includes[]', 'scanlation_group');
  params.append('limit', '500'); // Fetch more chapters to ensure we get the right language

  const { data } = await api.get(`/manga/${id}/feed?${params.toString()}`);
  return data.data;
};

export const getChapterPages = async (chapterId: string) => {
  const { data } = await api.get(`/at-home/server/${chapterId}`);
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

  const { data } = await api.get(`/manga?${params.toString()}`);
  return data.data;
};
