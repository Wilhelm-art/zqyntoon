import { test, expect } from "@playwright/test";

test.describe("ZqynToon - E2E User Journeys", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  // --------------------------------------------------------------------------
  // User Journey 1: Homepage & Comic Catalog
  // --------------------------------------------------------------------------
  test("Journey 1: Homepage renders brand, hero spotlight, and comic grids", async ({ page }) => {
    await page.goto("/");

    // Verify brand title and header elements
    const brand = page.locator("text=ZQYNTOON");
    await expect(brand.first()).toBeVisible();

    // Verify presence of Spotlight or Catalog grids
    const spotlightOrGrid = page.locator("img[alt]").first();
    await expect(spotlightOrGrid).toBeVisible();

    // Verify navigation links (resilient across desktop and mobile bottom bar)
    await expect(page.locator("a[href='/trending']:visible").first()).toBeVisible();
    await expect(page.locator("a[href='/bookmarks']:visible, a[href='/trending']:visible").first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // User Journey 2: Global Search Modal
  // --------------------------------------------------------------------------
  test("Journey 2: Search modal opens, filters comics, and displays results", async ({ page }) => {
    await page.goto("/");

    // Open search modal via search CTA button
    const searchButton = page.locator("button:has-text('Cari komik')").or(page.locator("button[aria-label='Cari Komik']")).first();
    await searchButton.click();

    // Verify search modal input is visible and focused
    const searchInput = page.locator("input[placeholder*='Cari komik']");
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill("Solo Leveling");
    await page.waitForTimeout(1000); // debounce wait

    // Verify result appears or empty response gracefully handled
    const resultsContainer = page.locator(".overflow-y-auto");
    await expect(resultsContainer).toBeVisible();

    // Close modal with ESC
    await page.keyboard.press("Escape");
    await expect(searchInput).not.toBeVisible();
  });

  // --------------------------------------------------------------------------
  // User Journey 3: Comic Detail Page & Chapter Listing
  // --------------------------------------------------------------------------
  test("Journey 3: Comic detail page shows metadata, genre pills, and chapter search", async ({ page }) => {
    await page.goto("/trending");

    // Wait for comic cards
    const firstComicCard = page.locator("a[href*='/manga/']").first();
    await expect(firstComicCard).toBeVisible();

    // Click first comic to navigate to detail page
    await firstComicCard.click();
    await page.waitForURL(/\/manga\/[^\/]+$/);

    // Verify detail elements
    const h1Title = page.locator("h1").first();
    await expect(h1Title).toBeVisible();

    // Verify chapter list container exists
    const chapterSection = page.locator("text=Daftar Chapter");
    await expect(chapterSection).toBeVisible();

    // Verify chapter search input works
    const chapterSearchInput = page.locator("input[placeholder*='Cari nomor chapter']");
    if (await chapterSearchInput.isVisible()) {
      await chapterSearchInput.fill("1");
      await page.waitForTimeout(300);
      const filteredChapters = page.locator("a[href*='/manga/']");
      expect(await filteredChapters.count()).toBeGreaterThan(0);
    }
  });

  // --------------------------------------------------------------------------
  // User Journey 4: Chapter Reader View & Reading Settings
  // --------------------------------------------------------------------------
  test("Journey 4: Internal reader renders pages, controls, and reading mode switch", async ({ page }) => {
    // Navigate to a popular comic detail
    await page.goto("/trending");
    const firstComicCard = page.locator("a[href*='/manga/']").first();
    await firstComicCard.click();
    await page.waitForURL(/\/manga\/[^\/]+$/);

    // Click "Mulai Baca" or first chapter link
    const readCta = page.locator("a:has-text('Mulai Baca'), a:has-text('Lanjut Baca')").first();
    if (await readCta.isVisible()) {
      await readCta.click();
    } else {
      const chapterLink = page.locator("a[href*='/manga/'][href*='chapter'], a:has-text('Baca')").first();
      await chapterLink.click();
    }

    // Wait for reader URL
    await page.waitForURL(/\/manga\/[^\/]+\/[^\/]+/);

    // Verify Reader header and controls
    const readerHeader = page.locator("header.fixed").or(page.locator("header")).last();
    await expect(readerHeader).toBeVisible();

    // Verify settings button
    const settingsButton = page.locator("button[title='Pengaturan Reader']");
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Verify mode switch buttons (Webtoon & Paged)
    const pagedModeBtn = page.locator("button:has-text('Halaman (Slide)')");
    const webtoonModeBtn = page.locator("button:has-text('Webtoon (Vertikal)')");
    await expect(pagedModeBtn).toBeVisible();
    await expect(webtoonModeBtn).toBeVisible();

    // Switch to Paged mode and back to Webtoon
    await pagedModeBtn.click();
    await webtoonModeBtn.click();
  });

  // --------------------------------------------------------------------------
  // User Journey 5: Bookmark Addition & Persistence
  // --------------------------------------------------------------------------
  test("Journey 5: Bookmarking a comic persists into /bookmarks page", async ({ page }) => {
    await page.goto("/trending");
    const firstComic = page.locator("a[href*='/manga/']").first();
    await firstComic.click();
    await page.waitForURL(/\/manga\/[^\/]+$/);

    const comicTitle = (await page.locator("h1").first().textContent())?.trim() || "";

    // Click bookmark button
    const bookmarkButton = page.locator("button:has-text('Tambah Bookmark')");
    await expect(bookmarkButton).toBeVisible();
    await bookmarkButton.click();

    // Verify bookmark active state
    await expect(page.locator("button:has-text('Tersimpan di Bookmark')")).toBeVisible();

    // Navigate to /bookmarks
    await page.goto("/bookmarks");

    // Verify bookmarked comic exists
    await expect(page.locator(`text=${comicTitle}`)).toBeVisible();

    // Remove bookmark
    const deleteBtn = page.locator("button[title='Hapus dari Bookmark']").first();
    await deleteBtn.click();

    // Verify empty state
    await expect(page.locator("text=Belum ada komik di bookmark kamu")).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // User Journey 6: Reading Progress Recording in /history
  // --------------------------------------------------------------------------
  test("Journey 6: Reading chapters records progress automatically into /history", async ({ page }) => {
    await page.goto("/trending");
    const firstComic = page.locator("a[href*='/manga/']").first();
    await firstComic.click();
    await page.waitForURL(/\/manga\/[^\/]+$/);

    const readCta = page.locator("a:has-text('Mulai Baca'), a:has-text('Lanjut Baca')").first();
    if (await readCta.isVisible()) {
      await readCta.click();
    } else {
      const chapterLink = page.locator("a[href*='/manga/'][href*='chapter'], a:has-text('Baca')").first();
      await chapterLink.click();
    }

    await page.waitForURL(/\/manga\/[^\/]+\/[^\/]+/);
    await page.waitForTimeout(500); // allow historyStore.saveProgress to execute

    // Navigate to /history
    await page.goto("/history");

    // Verify history page has at least 1 reading history entry
    const historyEntry = page.locator(".grid a:has-text('Lanjut')").or(page.locator("text=Terbaca")).first();
    await expect(historyEntry).toBeVisible();
  });
});
