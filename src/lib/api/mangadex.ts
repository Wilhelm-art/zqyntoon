import axios from 'axios';
import https from 'https';

// Configure axios with a custom agent to bypass strict SSL verification issues occasionally thrown by MangaDex's altnames CDN routing during Next.js SSG builds
const agent = new https.Agent({  
  rejectUnauthorized: false
});

const api = axios.create({
  baseURL: 'https://api.mangadex.org',
  httpsAgent: agent
});

// Helper function to extract cover art from relationships
export const getCoverUrl = (mangaId: string, fileName?: string) => {
  if (!fileName) return 'https://mangadex.org/title/placeholder.png'; // Fallback
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
};

export const getMangaList = async ({ limit = 20, offset = 0, includes = ['cover_art', 'author'] }) => {
  // Use URLSearchParams directly to bypass axios array serialization format (includes[] vs includes)
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  includes.forEach(inc => params.append('includes[]', inc)); // MangaDex requires includes[] for relationships
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

  const { data } = await api.get(`/manga/${id}/feed?${params.toString()}`);
  return data.data;
};

export const getChapterPages = async (chapterId: string) => {
  const { data } = await api.get(`/at-home/server/${chapterId}`);
  const baseUrl = data.baseUrl;
  const hash = data.chapter.hash;
  const pages = data.chapter.data; // High-quality data. Use dataSaver for compressed.
  
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
