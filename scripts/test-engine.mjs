import { getLatestComics, getPopularComics, searchComics, getComicDetail, getChapterPages } from "../src/lib/scraper/bacakomik.ts";

async function runTests() {
  console.log("=== [TEST 1] Testing getLatestComics ===");
  try {
    const latest = await getLatestComics(1);
    console.log(`✓ Fetched ${latest.comics.length} latest comics. HasNextPage: ${latest.hasNextPage}`);
    if (latest.comics.length > 0) {
      console.log(`  Sample 1: ${latest.comics[0].title} (${latest.comics[0].slug}) - ${latest.comics[0].latestChapter}`);
    }
  } catch (err) {
    console.error("✗ getLatestComics failed:", err.message);
  }

  console.log("\n=== [TEST 2] Testing getPopularComics ===");
  try {
    const popular = await getPopularComics();
    console.log(`✓ Fetched ${popular.length} popular comics.`);
    if (popular.length > 0) {
      console.log(`  Sample 1: ${popular[0].title} (${popular[0].slug})`);
    }
  } catch (err) {
    console.error("✗ getPopularComics failed:", err.message);
  }

  console.log("\n=== [TEST 3] Testing searchComics ('One Piece') ===");
  let sampleSlug = "one-piece";
  try {
    const searchRes = await searchComics("One Piece");
    console.log(`✓ Found ${searchRes.length} results for 'One Piece'.`);
    if (searchRes.length > 0) {
      sampleSlug = searchRes[0].slug;
      console.log(`  Found: ${searchRes[0].title} -> Slug: ${sampleSlug}`);
    }
  } catch (err) {
    console.error("✗ searchComics failed:", err.message);
  }

  console.log(`\n=== [TEST 4] Testing getComicDetail ('${sampleSlug}') ===`);
  let sampleChapterId = "";
  try {
    const detail = await getComicDetail(sampleSlug);
    console.log(`✓ Title: ${detail.title}`);
    console.log(`✓ Type: ${detail.type} | Status: ${detail.status} | Rating: ${detail.rating}`);
    console.log(`✓ Genres: ${detail.genres.join(", ")}`);
    console.log(`✓ Total Chapters: ${detail.chapters.length}`);
    if (detail.chapters.length > 0) {
      sampleChapterId = detail.chapters[0].id;
      console.log(`  Latest chapter: ${detail.chapters[0].title} (ID: ${sampleChapterId})`);
    }
  } catch (err) {
    console.error("✗ getComicDetail failed:", err.message);
  }

  if (sampleChapterId) {
    console.log(`\n=== [TEST 5] Testing getChapterPages ('${sampleChapterId}') ===`);
    try {
      const chapterData = await getChapterPages(sampleChapterId);
      console.log(`✓ Chapter Title: ${chapterData.title}`);
      console.log(`✓ Pages found: ${chapterData.pages.length}`);
      console.log(`✓ Prev Chapter: ${chapterData.prevChapterSlug} | Next Chapter: ${chapterData.nextChapterSlug}`);
      if (chapterData.pages.length > 0) {
        const sampleImgUrl = chapterData.pages[0];
        console.log(`  Sample image URL: ${sampleImgUrl}`);

        console.log("\n=== [TEST 6] Testing Image Anti-Hotlink Bypass ===");
        const proxyRes = await fetch(sampleImgUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0.0.0 Safari/537.36",
            "Referer": "https://bacakomik.my/",
            "Accept": "image/*,*/*;q=0.8",
          },
        });
        console.log(`✓ Upstream image status: ${proxyRes.status} ${proxyRes.statusText}`);
        console.log(`✓ Content-Type: ${proxyRes.headers.get("content-type")}`);
        console.log(`✓ Content-Length: ${proxyRes.headers.get("content-length")} bytes`);
        if (proxyRes.ok) {
          console.log(">>> SUCCESS: 403 BYPASS CONFIRMED! Image successfully loaded via anti-hotlink headers! <<<");
        }
      }
    } catch (err) {
      console.error("✗ getChapterPages failed:", err.message);
    }
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
}

runTests();
