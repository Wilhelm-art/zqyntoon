import * as cheerio from 'cheerio';

const BASE_URL = 'https://komikcast.bz';

export async function searchManga(title: string) {
  const url = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    // Prevent Next.js from caching scraper results aggressively
    next: { revalidate: 3600 }
  });
  
  if (!response.ok) {
    const errText = await response.text().catch(() => 'No text');
    throw new Error(`Failed to fetch search page: ${response.status} ${errText.substring(0, 100)}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const results: any[] = [];
  
  $('.list-update_item').each((_, el) => {
    const a = $(el).find('a');
    const endpoint = a.attr('href')?.replace(BASE_URL, '');
    const title = a.attr('title');
    const coverUrl = $(el).find('img').attr('src');
    
    if (endpoint && title) {
      results.push({
        endpoint,
        title,
        coverUrl
      });
    }
  });
  
  return results;
}

export async function getChapters(endpoint: string) {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    next: { revalidate: 3600 }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get chapters: ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const chapters: any[] = [];
  
  $('.komik_info-chapters-item').each((_, el) => {
    const a = $(el).find('a.chapter-link-item');
    const endpoint = a.attr('href')?.replace(BASE_URL, '');
    let title = a.text().trim();
    // Komikcast usually prefixes with "Chapter XX", let's clean it up slightly if needed
    
    const date = $(el).find('.chapter-link-time').text().trim();
    
    if (endpoint) {
      // Extract chapter number from title (e.g. "Chapter 200")
      const match = title.match(/Chapter\s+(\d+(\.\d+)?)/i);
      const chapterNumber = match ? match[1] : title;
      
      const safeId = Buffer.from(endpoint).toString('base64');

      chapters.push({
        id: `id-scraper:${safeId}`,
        chapter_number: chapterNumber,
        title: title,
        published_at: date || new Date().toISOString(),
        scanlator: 'Komikcast',
        externalUrl: null, // Because we can read it on our site!
        isScraper: true,
        scraperEndpoint: endpoint
      });
    }
  });
  
  return chapters;
}

export async function getPages(endpoint: string) {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    next: { revalidate: 86400 } // chapters don't change
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get pages: ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const pages: string[] = [];
  
  $('.main-reading-area img').each((_, el) => {
    let src = $(el).attr('src');
    if (!src) src = $(el).attr('data-src'); // fallback for lazyload
    
    if (src) {
      pages.push(src.trim());
    }
  });
  
  return pages;
}
