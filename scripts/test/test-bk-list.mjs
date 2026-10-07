import * as cheerio from 'cheerio';

const BASE_URL = 'https://bacakomik.my';

export async function scrapeComicList(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];

  $('.animepost').each((_, el) => {
    const a = $(el).find('a').first();
    const rawTitle = a.attr('title') || $(el).find('.tt').text().trim();
    const title = rawTitle.replace(/^Komik\s+/i, '').trim();
    let href = a.attr('href') || '';
    
    // Extract slug from href e.g. "https://bacakomik.my/komik/solo-leveling/" -> "solo-leveling"
    let slug = href.replace(BASE_URL, '').replace(/^\/komik\//, '').replace(/\/$/, '');
    if (!slug) return;

    let img = $(el).find('img').attr('data-lazy-src') || $(el).find('img').attr('src') || '';
    if (img.startsWith('data:image/svg')) {
      img = $(el).find('img').attr('data-lazy-src') || '';
    }

    const type = $(el).find('.typeflag, .type').text().trim() || 'Manhwa';
    const score = $(el).find('.rating i, .score').text().trim() || null;
    const latestChapter = $(el).find('.lsch a').text().trim() || null;

    items.push({
      id: `bk:${slug}`,
      slug: `bk:${slug}`,
      rawSlug: slug,
      title,
      coverUrl: img,
      source: 'bacakomik',
      author: 'Unknown',
      rating: score ? parseFloat(score) : null,
      status: 'Ongoing',
      genres: [type],
      latestChapter,
      synopsis: `Komik ${title} bahasa Indonesia update terbaru di ZynqToon.`,
    });
  });

  return items;
}

async function test() {
  console.log('Testing Popular ID Comics...');
  const pop = await scrapeComicList(`${BASE_URL}/komik-populer/`);
  console.log(`Popular count: ${pop.length}`);
  console.log('Top 3 Popular:', pop.slice(0, 3).map(p => ({ title: p.title, slug: p.slug, cover: p.coverUrl })));

  console.log('\nTesting Latest ID Comics...');
  const latest = await scrapeComicList(`${BASE_URL}/komik-terbaru/`);
  console.log(`Latest count: ${latest.length}`);
  console.log('Top 3 Latest:', latest.slice(0, 3).map(p => ({ title: p.title, slug: p.slug, latestCh: p.latestChapter })));
}

test();
