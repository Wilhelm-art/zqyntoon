const cheerio = require('cheerio');

async function test() {
  // 1. Search
  const searchUrl = 'https://bacakomik.my/?s=solo+leveling';
  const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const searchHtml = await searchRes.text();
  const $s = cheerio.load(searchHtml);
  
  const searchResults = [];
  $s('.animepost').each((_, el) => {
    const a = $s(el).find('a').first();
    const title = a.attr('title');
    let url = a.attr('href');
    if (url) url = url.replace('https://bacakomik.my', '');
    if (title && url) {
      searchResults.push({ title, url });
    }
  });
  console.log('Search Results:', searchResults.slice(0, 2));
  
  if (searchResults.length === 0) return;

  // 2. Chapters
  const mangaUrl = 'https://bacakomik.my' + searchResults[0].url;
  const mangaRes = await fetch(mangaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const mangaHtml = await mangaRes.text();
  const $m = cheerio.load(mangaHtml);
  
  const chapters = [];
  $m('#chapter_list li').each((_, el) => {
    const a = $m(el).find('.lchx a');
    const chapterTitle = a.text().trim();
    let chapterUrl = a.attr('href');
    if (chapterUrl) chapterUrl = chapterUrl.replace('https://bacakomik.my', '');
    if (chapterTitle && chapterUrl) {
      chapters.push({ chapterTitle, chapterUrl });
    }
  });
  console.log('Chapters:', chapters.slice(0, 2));

  if (chapters.length === 0) return;

  // 3. Images
  const chapterUrl = 'https://bacakomik.my' + chapters[0].chapterUrl;
  const chapterRes = await fetch(chapterUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const chapterHtml = await chapterRes.text();
  const $c = cheerio.load(chapterHtml);
  
  const images = [];
  $c('#chimg-auh img').each((_, el) => {
    images.push($c(el).attr('src') || '');
    if (_ === 0) console.log('Attrs:', el.attribs);
  });
  console.log('Images:', images.length);
}

test().catch(console.error);
