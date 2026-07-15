const cheerio = require('cheerio');
const https = require('https');

https.get('https://komikcast.bz/chapter/solo-leveling-chapter-110-bahasa-indonesia/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const images = [];
    $('.main-reading-area img').each((_, el) => {
      images.push($(el).attr('src') || $(el).attr('data-src'));
    });
    console.log('Found images with .main-reading-area img:', images.length);
    if (images.length === 0) {
      console.log('Trying fallback #1: #chapter_img img');
      $('#chapter_img img').each((_, el) => {
        images.push($(el).attr('src') || $(el).attr('data-src'));
      });
      console.log('Found images with #chapter_img img:', images.length);
    }
  });
}).on('error', err => console.error(err));
