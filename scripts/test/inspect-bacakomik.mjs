import * as cheerio from 'cheerio';

async function testChapterPages() {
  const url = 'https://bacakomik.my/solo-leveling-chapter-1/';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const pages = [];
  $('#chimg-auh img').each((_, el) => {
    let src = $(el).attr('data-lazy-src') || $(el).attr('src');
    if (src && !src.startsWith('data:image/svg')) {
      pages.push(src.trim());
    }
  });

  console.log(`Pages loaded for Solo Leveling Ch 1: ${pages.length}`);
  console.log('Sample pages:', pages.slice(0, 3));
}

testChapterPages();
