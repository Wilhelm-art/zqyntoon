import * as cheerio from 'cheerio';

const BASE_URL = 'https://bacakomik.my';

export async function searchManga(query: string) {
  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    next: { revalidate: 3600 }
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
    const title = a.attr('title');
    let endpoint = a.attr('href');
    const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-lazy-src');
    
    if (title && endpoint) {
      // Remove base url if absolute
      endpoint = endpoint.replace(BASE_URL, '');
      results.push({
        title,
        endpoint,
        image
      });
    }
  });
  
  return results;
}

export async function getChapters(endpoint: string) {
  // Ensure endpoint starts with slash or just build URL safely
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    next: { revalidate: 3600 }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get chapters: ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const chapters: any[] = [];
  
  $('#chapter_list li').each((_, el) => {
    const a = $(el).find('.lchx a');
    let chapterTitle = a.text().trim();
    // Bacakomik title has newlines like "Chapter \n 68"
    chapterTitle = chapterTitle.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    let chapterEndpoint = a.attr('href');
    
    if (chapterTitle && chapterEndpoint) {
      chapterEndpoint = chapterEndpoint.replace(BASE_URL, '');
      
      const chapterNumber = chapterTitle.replace(/[^0-9.]/g, '');
      
      chapters.push({
        id: `id-scraper:${chapterEndpoint}`,
        chapter_number: chapterNumber || '0',
        title: chapterTitle,
        externalUrl: null, // We can scrape it internally
      });
    }
  });
  
  return chapters;
}

export async function getPages(endpoint: string) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    next: { revalidate: 86400 } // chapters don't change
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get pages: ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const pages: string[] = [];
  
  $('#chimg-auh img').each((_, el) => {
    let src = $(el).attr('data-lazy-src');
    if (!src) src = $(el).attr('src'); 
    
    // Ignore placeholder svg if data-lazy-src exists but we picked src
    if (src && !src.startsWith('data:image/svg')) {
      pages.push(src.trim());
    }
  });
  
  return pages;
}
