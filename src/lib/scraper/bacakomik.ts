import * as cheerio from 'cheerio';
import { MangaCardData } from '../api/mappers';

const BASE_URL = 'https://bacakomik.my';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Universal slug sanitizer to safely handle encoded URL colons, prefixes, and paths.
 */
export function sanitizeSlug(input: string): string {
  if (!input) return '';
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {}
  return decoded
    .replace(/^https?:\/\/[^\/]+/i, '')
    .replace(/^(bk:|bk-|bk%3A|id-scraper:|id-scraper%3A)/i, '')
    .replace(/^\/komik\//i, '')
    .replace(/^\/+/i, '')
    .replace(/\/+$/i, '')
    .trim();
}

/**
 * Scrapes a list of comics from a Bacakomik archive or category page.
 */
async function scrapeComicList(url: string, revalidateSecs = 1800): Promise<MangaCardData[]> {
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: revalidateSecs },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const items: MangaCardData[] = [];

    $('.animepost').each((_, el) => {
      const a = $(el).find('a').first();
      const rawTitle = a.attr('title') || $(el).find('.tt').text().trim();
      const title = rawTitle.replace(/^Komik\s+/i, '').trim();
      const href = a.attr('href') || '';

      const slug = sanitizeSlug(href);
      if (!slug || !title) return;

      let img = $(el).find('img').attr('data-lazy-src') || $(el).find('img').attr('src') || '';
      if (img.startsWith('data:image/svg')) {
        img = $(el).find('img').attr('data-lazy-src') || '';
      }

      const type = $(el).find('.typeflag, .type').text().trim() || 'Manhwa';
      const score = $(el).find('.rating i, .score').text().trim();

      items.push({
        id: `bk-${slug}`,
        slug: `bk-${slug}`,
        title,
        coverUrl: img,
        source: 'bacakomik',
        author: 'Unknown',
        rating: score ? parseFloat(score) : null,
        status: 'Ongoing',
        genres: [type],
        synopsis: `Komik ${title} bahasa Indonesia update terbaru di ZynqToon.`,
      });
    });

    return items;
  } catch (error) {
    console.error(`Bacakomik list scrape error on ${url}:`, error);
    return [];
  }
}

/**
 * Get popular comics in Bahasa Indonesia
 */
export async function getPopularComics(): Promise<MangaCardData[]> {
  return scrapeComicList(`${BASE_URL}/komik-populer/`, 3600);
}

/**
 * Get latest updated comics in Bahasa Indonesia
 */
export async function getLatestComics(): Promise<MangaCardData[]> {
  return scrapeComicList(`${BASE_URL}/komik-terbaru/`, 900);
}

/**
 * Get manhwa list in Bahasa Indonesia
 */
export async function getManhwaComics(): Promise<MangaCardData[]> {
  return scrapeComicList(`${BASE_URL}/baca-manhwa/`, 3600);
}

/**
 * Search comics on Bacakomik with exact-match relevance ranking
 */
export async function searchManga(query: string): Promise<any[]> {
  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'No text');
    throw new Error(`Failed to fetch search page: ${response.status} ${errText.substring(0, 100)}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const results: any[] = [];

  $('.animepost').each((_, el) => {
    const a = $(el).find('a').first();
    const rawTitle = a.attr('title') || $(el).find('.tt').text().trim();
    const title = rawTitle.replace(/^Komik\s+/i, '').trim();
    let endpoint = a.attr('href') || '';
    let img = $(el).find('img').attr('data-lazy-src') || $(el).find('img').attr('src') || '';
    if (img.startsWith('data:image/svg')) {
      img = $(el).find('img').attr('data-lazy-src') || '';
    }

    if (title && endpoint) {
      const slug = sanitizeSlug(endpoint);

      results.push({
        id: `bk-${slug}`,
        slug: `bk-${slug}`,
        title,
        endpoint: `/komik/${slug}/`,
        image: img,
      });
    }
  });

  const qLower = query.toLowerCase().trim();
  results.sort((a, b) => {
    const aLower = a.title.toLowerCase();
    const bLower = b.title.toLowerCase();
    const aExact = aLower === qLower ? 2 : (aLower.startsWith(qLower) ? 1 : 0);
    const bExact = bLower === qLower ? 2 : (bLower.startsWith(qLower) ? 1 : 0);
    return bExact - aExact;
  });

  return results;
}

export interface BacakomikDetail {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  source: string;
  author: string;
  status: string;
  genres: string[];
  synopsis: string;
  chapters: Array<{
    id: string;
    chapter_number: string;
    title: string;
    externalUrl: null;
    isScraper: true;
  }>;
}

/**
 * Get full comic details and chapters from Bacakomik
 */
export async function getComicDetail(slug: string): Promise<BacakomikDetail> {
  const cleanSlug = sanitizeSlug(slug);
  const url = `${BASE_URL}/komik/${cleanSlug}/`;

  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Comic not found: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const rawTitle = $('.entry-title, h1.entry-title').text().trim();
  const title = rawTitle.replace(/^Komik\s+/i, '').trim();

  let synopsis = $('.entry-content-single, .desc, .sin').text().trim();
  synopsis = synopsis.replace(/\s+/g, ' ').replace(/^Sinopsis\s+/i, '').trim();

  let cover = $('.thumb img').attr('data-lazy-src') || $('.thumb img').attr('src') || '';
  if (cover.startsWith('data:image/svg')) {
    cover = $('.thumb img').attr('data-lazy-src') || '';
  }

  const genres: string[] = [];
  $('.genre-info a, .seriestagenre a').each((_, el) => {
    const g = $(el).text().trim();
    if (g && !genres.includes(g)) genres.push(g);
  });

  const authorRaw = $('.infox .spe span:contains("Pengarang"), .spe span:contains("Author")').text().trim();
  const author = authorRaw.replace(/^(Pengarang|Author)\s*:\s*/i, '').trim() || 'Unknown Author';

  const statusRaw = $('.infox .spe span:contains("Status")').text().trim();
  const status = statusRaw.replace(/^Status\s*:\s*/i, '').trim() || 'Ongoing';

  const chapters: Array<{ id: string; chapter_number: string; title: string; externalUrl: null; isScraper: true }> = [];
  $('#chapter_list li').each((_, el) => {
    const a = $(el).find('.lchx a');
    const chTitle = a.text().trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    const chHref = a.attr('href') || '';

    const chSlug = sanitizeSlug(chHref);

    if (chSlug) {
      const matchNum = chTitle.match(/Chapter\s+([0-9.]+)/i);
      const chapterNumber = matchNum ? matchNum[1] : chTitle.replace(/[^0-9.]/g, '') || '0';

      chapters.push({
        id: `bk-${chSlug}`,
        chapter_number: chapterNumber,
        title: chTitle,
        externalUrl: null,
        isScraper: true,
      });
    }
  });

  return {
    id: `bk-${cleanSlug}`,
    slug: `bk-${cleanSlug}`,
    title: title || cleanSlug.replace(/-/g, ' '),
    coverUrl: cover,
    source: 'bacakomik',
    author,
    status,
    genres: genres.length > 0 ? genres : ['Manhwa'],
    synopsis: synopsis || `Baca komik ${title || cleanSlug} bahasa Indonesia terlengkap dan terupdate di ZynqToon.`,
    chapters,
  };
}

/**
 * Get chapter image pages from Bacakomik
 */
export async function getChapterPages(chapterSlug: string): Promise<string[]> {
  const cleanSlug = sanitizeSlug(chapterSlug);
  const url = `${BASE_URL}/${cleanSlug}/`;

  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Failed to get chapter pages: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pages: string[] = [];

  $('#chimg-auh img').each((_, el) => {
    let src = $(el).attr('data-lazy-src') || $(el).attr('src');
    if (src && !src.startsWith('data:image/svg')) {
      pages.push(src.trim());
    }
  });

  return pages;
}

// Backward-compatible exports
export async function getChapters(endpoint: string) {
  const detail = await getComicDetail(endpoint);
  return detail.chapters;
}

export async function getPages(endpoint: string) {
  return getChapterPages(endpoint);
}
