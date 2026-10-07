const BASE = "http://localhost:3050";

async function runE2E() {
  console.log("=== [STARTING END-TO-END VERIFICATION SUITE] ===");
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• Testing ${name}... `);
    try {
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      failed++;
    }
  }

  // 1. Homepage
  await test("Homepage (/) renders with 200 and brand schema", async () => {
    const res = await fetch(`${BASE}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("ZQYN") || !text.includes("Komik Indonesia")) throw new Error("Missing brand title");
    if (!text.includes("schema.org")) throw new Error("Missing JSON-LD schema");
  });

  // 2. Trending
  await test("Trending page (/trending) renders with 200", async () => {
    const res = await fetch(`${BASE}/trending`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Komik Terpopuler")) throw new Error("Missing page header");
  });

  // 3. Latest
  await test("Latest page (/latest) renders with 200", async () => {
    const res = await fetch(`${BASE}/latest`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Rilis Chapter Terbaru")) throw new Error("Missing page header");
  });

  // 4. API Latest
  await test("API /api/id-scraper/latest returns comics array", async () => {
    const res = await fetch(`${BASE}/api/id-scraper/latest`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.comics) || json.comics.length === 0) throw new Error("Empty comics array");
  });

  // 5. API Search
  let sampleSlug = "one-piece-ace-story";
  await test("API /api/id-scraper/search searches Indonesian comics", async () => {
    const res = await fetch(`${BASE}/api/id-scraper/search?q=One+Piece`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.comics) || json.comics.length === 0) throw new Error("No search results");
    sampleSlug = json.comics[0].slug;
  });

  // 6. API Detail
  let sampleChapter = "";
  await test(`API /api/id-scraper/detail for '${sampleSlug}'`, async () => {
    const res = await fetch(`${BASE}/api/id-scraper/detail?slug=${sampleSlug}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.title || !json.chapters || json.chapters.length === 0) throw new Error("Incomplete detail");
    sampleChapter = json.chapters[0].id;
  });

  // 7. API Pages (Internal Reader Scraper)
  let samplePageUrl = "";
  await test(`API /api/id-scraper/pages for chapter '${sampleChapter}'`, async () => {
    const res = await fetch(`${BASE}/api/id-scraper/pages?chapter=${sampleChapter}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.pages) || json.pages.length === 0) throw new Error("No pages found");
    samplePageUrl = json.pages[0];
    console.log(`\n     ↳ Found ${json.pages.length} pages in chapter!`);
  });

  // 8. SSRF-Safe Anti-Hotlink Image Proxy
  await test("Image Proxy (/api/proxy) bypasses 403 and returns image binary", async () => {
    if (!samplePageUrl) throw new Error("No sample image URL");
    const proxyUrl = `${BASE}/api/proxy?url=${encodeURIComponent(samplePageUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.status !== 200) throw new Error(`Proxy status ${res.status}`);
    const ct = res.headers.get("content-type");
    if (!ct || !ct.startsWith("image/")) throw new Error(`Unexpected content type: ${ct}`);
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) throw new Error(`Image too small (${buffer.byteLength} bytes)`);
    console.log(`\n     ↳ Successfully proxied ${buffer.byteLength} bytes (${ct})`);
  });

  // 9. SSRF Block Verification
  await test("Image Proxy blocks SSRF attempts to localhost/internal IPs", async () => {
    const badUrl = `${BASE}/api/proxy?url=http://127.0.0.1:8080/secret`;
    const res = await fetch(badUrl);
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 10. Internal Reader Page HTML
  await test(`Internal Reader Page (/manga/${sampleSlug}/${sampleChapter}) renders cleanly`, async () => {
    const res = await fetch(`${BASE}/manga/${sampleSlug}/${sampleChapter}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes("ComicIssue")) throw new Error("Missing ComicIssue structured data");
    if (!html.includes("/api/proxy")) throw new Error("Missing internal image proxy URLs");
    if (!html.includes("Lembar Gambar") && !html.includes("Chapter")) throw new Error("Missing reader canvas elements");
  });

  // 11. SEO & GSO files
  await test("Sitemap, Robots.txt, and llms.txt accessible", async () => {
    const [sm, rb, llms] = await Promise.all([
      fetch(`${BASE}/sitemap.xml`),
      fetch(`${BASE}/robots.txt`),
      fetch(`${BASE}/llms.txt`),
    ]);
    if (sm.status !== 200) throw new Error(`Sitemap status ${sm.status}`);
    if (rb.status !== 200) throw new Error(`Robots status ${rb.status}`);
    if (llms.status !== 200) throw new Error(`llms.txt status ${llms.status}`);
  });

  console.log(`\n========================================`);
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

runE2E();
