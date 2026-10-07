import * as cheerio from 'cheerio';

async function testUrl(name, url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });
    console.log(`[${name}] ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      return html;
    }
  } catch (err) {
    console.log(`[${name}] Failed: ${err.message}`);
  }
  return null;
}

async function run() {
  console.log('Testing Indonesian Comic Sources...');
  
  // 1. Bacakomik Popular
  const bkHtml = await testUrl('Bacakomik Popular', 'https://bacakomik.my/daftar-manga/?order=popular');
  if (bkHtml) {
    const $ = cheerio.load(bkHtml);
    console.log('Bacakomik Popular items:', $('.animepost').length);
    $('.animepost').slice(0, 3).each((i, el) => {
      const title = $(el).find('a').first().attr('title');
      const href = $(el).find('a').first().attr('href');
      const img = $(el).find('img').attr('data-lazy-src') || $(el).find('img').attr('src');
      console.log(`  #${i+1}: ${title} -> ${href} | ${img?.slice(0, 60)}...`);
    });
  }

  // 2. Bacakomik Latest Updates
  const bkLatestHtml = await testUrl('Bacakomik Latest', 'https://bacakomik.my/daftar-manga/?order=update');
  if (bkLatestHtml) {
    const $ = cheerio.load(bkLatestHtml);
    console.log('Bacakomik Latest items:', $('.animepost').length);
  }

  // 3. Komiku
  await testUrl('Komiku', 'https://api.komiku.id/');
  await testUrl('Komiku Web', 'https://komiku.id/');

  // 4. Komikcast
  await testUrl('Komikcast bz', 'https://komikcast.bz/');
  await testUrl('Komikcast cz', 'https://komikcast.cz/');

  // 5. Kiryuu
  await testUrl('Kiryuu org', 'https://kiryuu.org/');
  await testUrl('Kiryuu id', 'https://kiryuu.id/');
}

run();
