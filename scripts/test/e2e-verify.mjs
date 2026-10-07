/**
 * ZynqToon - E2E Verification Script for Indonesian Comic Pipeline
 * Tests Homepage, Detail, Chapters, Reader Pages, and Image Proxy.
 */

import { getHomepageData } from '../../src/lib/api/unifiedManga.ts';
import { getComicDetail, getChapterPages, searchManga } from '../../src/lib/scraper/bacakomik.ts';

async function runVerification() {
  console.log('='.repeat(65));
  console.log('  ZYNQTOON - INDONESIAN COMIC PIPELINE E2E TEST');
  console.log('='.repeat(65));

  let passed = 0;
  let total = 5;

  // 1. Test Homepage Aggregator
  console.log('\n[TEST 1] Testing Homepage Indonesian Comic Aggregation...');
  try {
    const home = await getHomepageData();
    if (!home.hero || home.hero.length === 0) throw new Error('Hero is empty');
    if (!home.trending || home.trending.length === 0) throw new Error('Trending is empty');
    if (!home.latest || home.latest.length === 0) throw new Error('Latest is empty');

    console.log(`  ✓ Hero Comics     : ${home.hero.length} items (Lead: "${home.hero[0].title}" [${home.hero[0].source}])`);
    console.log(`  ✓ Trending Comics : ${home.trending.length} items (Top: "${home.trending[0].title}")`);
    console.log(`  ✓ Latest Comics   : ${home.latest.length} items (Recent: "${home.latest[0].title}")`);
    passed++;
  } catch (err) {
    console.error(`  ✗ Test 1 FAILED: ${err.message}`);
  }

  // 2. Test Search Indonesian Comics
  console.log('\n[TEST 2] Testing Indonesian Comic Search...');
  let sampleSlug = 'bk:solo-leveling';
  try {
    const searchRes = await searchManga('Solo Leveling');
    if (!searchRes || searchRes.length === 0) throw new Error('Search returned 0 results');
    console.log(`  ✓ Search "Solo Leveling" returned ${searchRes.length} results.`);
    console.log(`    Sample: "${searchRes[0].title}" -> ${searchRes[0].slug}`);
    if (searchRes[0].slug) sampleSlug = searchRes[0].slug;
    passed++;
  } catch (err) {
    console.error(`  ✗ Test 2 FAILED: ${err.message}`);
  }

  // 3. Test Detail Indonesian Comic
  console.log(`\n[TEST 3] Testing Indonesian Comic Detail (${sampleSlug})...`);
  let sampleChapterId = '';
  try {
    const detail = await getComicDetail(sampleSlug);
    if (!detail.title) throw new Error('Title missing');
    if (!detail.chapters || detail.chapters.length === 0) throw new Error('Chapters list empty');

    console.log(`  ✓ Title        : ${detail.title}`);
    console.log(`  ✓ Author       : ${detail.author}`);
    console.log(`  ✓ Status       : ${detail.status}`);
    console.log(`  ✓ Total Chapters: ${detail.chapters.length} Indonesian chapters!`);
    console.log(`    First Ch: ${detail.chapters[detail.chapters.length - 1].title}`);
    console.log(`    Latest Ch: ${detail.chapters[0].title} [${detail.chapters[0].id}]`);
    sampleChapterId = detail.chapters[detail.chapters.length - 1].id;
    passed++;
  } catch (err) {
    console.error(`  ✗ Test 3 FAILED: ${err.message}`);
  }

  // 4. Test Chapter Pages Extraction
  console.log(`\n[TEST 4] Testing Chapter Pages Reader (${sampleChapterId})...`);
  let sampleImageUrl = '';
  try {
    const pages = await getChapterPages(sampleChapterId);
    if (!pages || pages.length === 0) throw new Error('No pages found for chapter');

    console.log(`  ✓ Loaded ${pages.length} pages for ${sampleChapterId}`);
    sampleImageUrl = pages[0];
    console.log(`    Sample image: ${sampleImageUrl}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ Test 4 FAILED: ${err.message}`);
  }

  // 5. Test Image CDN Access with Anti-Hotlink Referer
  console.log(`\n[TEST 5] Testing Image CDN Loading with Anti-Hotlink Referer...`);
  try {
    if (!sampleImageUrl) throw new Error('No sample image URL from previous step');
    const imgRes = await fetch(sampleImageUrl, {
      headers: {
        'Referer': 'https://bacakomik.my/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
    const cType = imgRes.headers.get('content-type') || '';
    console.log(`  ✓ Image response: HTTP ${imgRes.status} (${cType})`);
    passed++;
  } catch (err) {
    console.error(`  ✗ Test 5 FAILED: ${err.message}`);
  }

  console.log('\n' + '='.repeat(65));
  console.log(`  RESULT: ${passed}/${total} TESTS PASSED`);
  console.log('='.repeat(65));

  if (passed !== total) process.exit(1);
}

runVerification();
