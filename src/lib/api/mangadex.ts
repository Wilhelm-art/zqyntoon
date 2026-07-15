/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { getAniListCover } from './anilist';

const isClient = typeof window !== 'undefined';
const getBaseUrl = () => {
    if (!isClient) return 'https://api.mangadex.org';
    return '/api/proxy?url=' + encodeURIComponent('https://api.mangadex.org');
};

const buildUrl = (path: string) => {
    if (!isClient) return `https://api.mangadex.org${path}`;
    return `/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org${path}`)}`;
}

export const getCoverUrl = (mangaId: string, fileName?: string) => {
  if (!fileName) return null; 
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
};

export const getCoverUrlWithFallback = async (mangaId: string, fileName?: string, title?: string) => {
  if (fileName) {
    return getCoverUrl(mangaId, fileName);
  }
  
  if (title) {
    const aniListCover = await getAniListCover(title);
    if (aniListCover) return aniListCover;
  }

  return '/cover-placeholder.svg';
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
