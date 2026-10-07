import * as cheerio from 'cheerio';

const BASE_URL = 'https://bacakomik.my';

export async function getComicDetail(slug) {
  const cleanSlug = slug.replace(/^bk:/, '');
  const url = `${BASE_URL}/komik/${cleanSlug}/`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36',
    },
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

  const genres = [];
  $('.genre-info a, .seriestagenre a').each((_, el) => {
    genres.push($(el).text().trim());
  });

  const authorRaw = $('.infox .spe span:contains("Pengarang"), .spe span:contains("Author")').text().trim();
  const author = authorRaw.replace(/^(Pengarang|Author)\s*:\s*/i, '').trim() || 'Unknown';

  const statusRaw = $('.infox .spe span:contains("Status")').text().trim();
  const status = statusRaw.replace(/^Status\s*:\s*/i, '').trim() || 'Ongoing';

  const chapters = [];
  $('#chapter_list li').each((_, el) => {
    const a = $(el).find('.lchx a');
    let chTitle = a.text().trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    const chHref = a.attr('href') || '';
    
    // Extract chapter slug e.g. "https://bacakomik.my/nano-machine-chapter-200/" -> "nano-machine-chapter-200"
    const chSlug = chHref.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '');
    
    if (chSlug) {
      const matchNum = chTitle.match(/Chapter\s+([0-9.]+)/i);
      const chapterNumber = matchNum ? matchNum[1] : chTitle.replace(/[^0-9.]/g, '') || '0';

      chapters.push({
        id: `bk:${chSlug}`,
        chapter_number: chapterNumber,
        title: chTitle,
        externalUrl: null,
      });
    }
  });

  return {
    id: `bk:${cleanSlug}`,
    slug: `bk:${cleanSlug}`,
    title,
    coverUrl: cover,
    source: 'bacakomik',
    author,
    status,
    genres: genres.length > 0 ? genres : ['Manhwa'],
    synopsis: synopsis || `Baca komik ${title} bahasa Indonesia gratis di ZynqToon.`,
    chapters,
  };
}

export async function getChapterPages(chapterSlug) {
  const cleanSlug = chapterSlug.replace(/^bk:/, '');
  const url = `${BASE_URL}/${cleanSlug}/`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Chapter not found: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const pages = [];
  $('#chimg-auh img').each((_, el) => {
    let src = $(el).attr('data-lazy-src') || $(el).attr('src');
    if (src && !src.startsWith('data:image/svg')) {
      pages.push(src.trim());
    }
  });

  return pages;
}

async function test() {
  console.log('Testing Detail for Nano Machine...');
  const detail = await getComicDetail('bk:nano-machine');
  console.log('Title:', detail.title);
  console.log('Author:', detail.author);
  console.log('Status:', detail.status);
  console.log('Genres:', detail.genres);
  console.log('Total Chapters:', detail.chapters.length);
  console.log('Latest Chapter:', detail.chapters[0]);
  console.log('First Chapter:', detail.chapters[detail.chapters.length - 1]);

  console.log('\nTesting Chapter Reader for Latest Chapter:');
  const pages = await getChapterPages(detail.chapters[0].id);
  console.log('Pages count:', pages.length);
  console.log('First 2 pages:', pages.slice(0, 2));
}

test();
