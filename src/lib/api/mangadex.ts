import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mangadex.org',
});

// Helper function to extract cover art from relationships
export const getCoverUrl = (mangaId: string, fileName?: string) => {
  if (!fileName) return 'https://mangadex.org/title/placeholder.png'; // Fallback
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
};

export const getMangaList = async ({ limit = 20, offset = 0, includes = ['cover_art', 'author'] }) => {
  const { data } = await api.get('/manga', {
    params: {
      limit,
      offset,
      includes,
      contentRating: ['safe', 'suggestive'], // Keep it safe for now
      availableTranslatedLanguage: ['en', 'id'], // Targeting EN and ID
    },
  });
  return data.data;
};

export const getMangaDetails = async (id: string) => {
  const { data } = await api.get(`/manga/${id}`, {
    params: {
      includes: ['cover_art', 'author', 'artist'],
    },
  });
  return data.data;
};

export const getMangaChapters = async (id: string, languages = ['en', 'id']) => {
  const { data } = await api.get(`/manga/${id}/feed`, {
    params: {
      translatedLanguage: languages,
      order: {
        chapter: 'desc',
      },
      includes: ['scanlation_group'],
    },
  });
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
  const { data } = await api.get('/manga', {
    params: {
      title,
      includes: ['cover_art'],
      contentRating: ['safe', 'suggestive'],
    },
  });
  return data.data;
};
