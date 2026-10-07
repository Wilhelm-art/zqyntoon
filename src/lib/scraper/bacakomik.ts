import * as cheerio from "cheerio";

const BASE_URL = "https://bacakomik.my";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
];

async function fetchHtml(url: string): Promise<string> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const response = await fetch(url, {
    headers: {
      "User-Agent": ua,
      "Referer": BASE_URL,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
    },
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export interface ComicItem {
  slug: string;
  title: string;
  cover: string;
  type?: string;
  latestChapter?: string;
  latestChapterSlug?: string;
  rating?: string;
  updatedAt?: string;
}

export interface ChapterItem {
  id: string; // chapter slug e.g. "one-piece-chapter-1138"
  title: string;
  releaseDate?: string;
}

export interface ComicDetail {
  slug: string;
  title: string;
  alternativeTitle?: string;
  cover: string;
  synopsis: string;
  type: string; // Manga | Manhwa | Manhua
  status: string; // Ongoing | Completed
  author?: string;
  artist?: string;
  rating?: string;
  genres: string[];
  chapters: ChapterItem[];
}

export interface ChapterPagesResult {
  comicSlug: string;
  chapterSlug: string;
  title: string;
  pages: string[];
  prevChapterSlug?: string | null;
  nextChapterSlug?: string | null;
}

function cleanImageUrl(url?: string): string {
  if (!url) return "";
  let clean = url.trim();
  if (clean.startsWith("//")) {
    clean = "https:" + clean;
  }
  return clean;
}

function extractSlugFromUrl(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url, BASE_URL);
    const parts = parsed.pathname.split("/").filter(Boolean);
    // e.g. /manga/one-piece/ -> parts: ["manga", "one-piece"]
    if (parts.length >= 2 && parts[0] === "manga") {
      return parts[1];
    }
    return parts[parts.length - 1] || "";
  } catch {
    const clean = url.replace(/\/+$/, "");
    const parts = clean.split("/");
    return parts[parts.length - 1] || "";
  }
}

/**
 * Get latest updated comics in Indonesian
 */
export async function getLatestComics(page: number = 1): Promise<{ comics: ComicItem[]; hasNextPage: boolean }> {
  const url = page === 1 ? `${BASE_URL}/komik-terbaru/` : `${BASE_URL}/komik-terbaru/page/${page}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const comics: ComicItem[] = [];

  $(".animepost").each((_, el) => {
    const titleEl = $(el).find(".tt h4, .tt h2, .animepost-title");
    const linkEl = $(el).find("a").first();
    const href = linkEl.attr("href") || "";
    const slug = extractSlugFromUrl(href);
    const title = titleEl.text().trim() || $(el).find("img").attr("title") || $(el).find("img").attr("alt") || slug;

    const imgEl = $(el).find("img");
    const cover = cleanImageUrl(
      imgEl.attr("data-lazy-src") || imgEl.attr("data-src") || imgEl.attr("src")
    );

    const type = $(el).find(".typeflag, .type").text().trim() || "Manga";
    const latestChapter = $(el).find(".adds .epx, .lsch a").first().text().trim();
    const latestChapterHref = $(el).find(".adds .epx a, .lsch a").first().attr("href") || "";
    const latestChapterSlug = extractSlugFromUrl(latestChapterHref);
    const rating = $(el).find(".rating i, .numscore").text().trim();
    const updatedAt = $(el).find(".adds .date, .lsch .time").first().text().trim();

    if (slug && title) {
      comics.push({
        slug,
        title,
        cover,
        type,
        latestChapter,
        latestChapterSlug,
        rating,
        updatedAt,
      });
    }
  });

  const hasNextPage = $(".pagination .next, .hpage .r").length > 0;
  return { comics, hasNextPage };
}

/**
 * Get popular / trending comics
 */
export async function getPopularComics(page: number = 1): Promise<ComicItem[]> {
  const url = page === 1 ? `${BASE_URL}/komik-populer/` : `${BASE_URL}/komik-populer/page/${page}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const comics: ComicItem[] = [];

  $(".animepost").each((_, el) => {
    const titleEl = $(el).find(".tt h4, .tt h2, .animepost-title");
    const linkEl = $(el).find("a").first();
    const href = linkEl.attr("href") || "";
    const slug = extractSlugFromUrl(href);
    const title = titleEl.text().trim() || $(el).find("img").attr("alt") || slug;

    const imgEl = $(el).find("img");
    const cover = cleanImageUrl(
      imgEl.attr("data-lazy-src") || imgEl.attr("data-src") || imgEl.attr("src")
    );

    const type = $(el).find(".typeflag, .type").text().trim() || "Manga";
    const rating = $(el).find(".rating i, .numscore").text().trim();

    if (slug && title) {
      comics.push({
        slug,
        title,
        cover,
        type,
        rating,
      });
    }
  });

  return comics;
}

/**
 * Search comics by title
 */
export async function searchComics(query: string): Promise<ComicItem[]> {
  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const comics: ComicItem[] = [];

  $(".animepost").each((_, el) => {
    const titleEl = $(el).find(".tt h4, .tt h2, .animepost-title");
    const linkEl = $(el).find("a").first();
    const href = linkEl.attr("href") || "";
    const slug = extractSlugFromUrl(href);
    const title = titleEl.text().trim() || $(el).find("img").attr("alt") || slug;

    const imgEl = $(el).find("img");
    const cover = cleanImageUrl(
      imgEl.attr("data-lazy-src") || imgEl.attr("data-src") || imgEl.attr("src")
    );

    const type = $(el).find(".typeflag, .type").text().trim() || "Manga";
    const latestChapter = $(el).find(".adds .epx, .lsch a").first().text().trim();
    const rating = $(el).find(".rating i, .numscore").text().trim();

    if (slug && title) {
      comics.push({
        slug,
        title,
        cover,
        type,
        latestChapter,
        rating,
      });
    }
  });

  return comics;
}

/**
 * Get detailed metadata and all chapters for a comic
 */
export async function getComicDetail(slug: string): Promise<ComicDetail> {
  const url = `${BASE_URL}/manga/${slug}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title = $(".entry-title, .infox h1").first().text().trim();
  const alternativeTitle = $(".spe span:contains('Alternatif'), .spe span:contains('Alternative')").text().replace(/.*:\s*/, "").trim();

  const imgEl = $(".thumb img").first();
  const cover = cleanImageUrl(
    imgEl.attr("data-lazy-src") || imgEl.attr("data-src") || imgEl.attr("src")
  );

  const synopsis = $(".desc, .entry-content-single, .entry-content").text().trim();

  let type = "Manga";
  const typeText = $(".spe span:contains('Jenis'), .spe span:contains('Type')").text();
  if (/manhwa/i.test(typeText)) type = "Manhwa";
  else if (/manhua/i.test(typeText)) type = "Manhua";

  let status = "Ongoing";
  const statusText = $(".spe span:contains('Status')").text();
  if (/tamat|completed|selesai/i.test(statusText)) status = "Completed";

  const author = $(".spe span:contains('Pengarang'), .spe span:contains('Author')").text().replace(/.*:\s*/, "").trim();
  const artist = $(".spe span:contains('Ilustrator'), .spe span:contains('Artist')").text().replace(/.*:\s*/, "").trim();
  const rating = $(".rating i, .numscore").first().text().trim();

  const genres: string[] = [];
  $(".genre-info a, .spe a[href*='genre']").each((_, el) => {
    const g = $(el).text().trim();
    if (g && !genres.includes(g)) genres.push(g);
  });

  const chapters: ChapterItem[] = [];
  $("#chapter_list li, .clstyle li, .lchx").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href") || "";
    const chapterId = extractSlugFromUrl(href);
    const chapterTitle = a.text().trim();
    const releaseDate = $(el).find(".dt, .date, .time").first().text().trim();

    if (chapterId && chapterTitle) {
      chapters.push({
        id: chapterId,
        title: chapterTitle,
        releaseDate,
      });
    }
  });

  return {
    slug,
    title: title || slug,
    alternativeTitle,
    cover,
    synopsis,
    type,
    status,
    author,
    artist,
    rating,
    genres,
    chapters,
  };
}

/**
 * Get chapter image pages for the internal reader
 */
export async function getChapterPages(chapterSlug: string): Promise<ChapterPagesResult> {
  const url = `${BASE_URL}/${chapterSlug}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const rawTitle = $(".entry-title, h1").first().text().trim();
  const title = rawTitle.replace(/\s+/g, " ");

  // Find Comic slug
  let comicSlug = "";
  const allBreadcrumbs = $("a[href*='/manga/']");
  if (allBreadcrumbs.length > 0) {
    comicSlug = extractSlugFromUrl(allBreadcrumbs.first().attr("href"));
  }

  // Extract page images
  const pages: string[] = [];
  const imageContainers = [
    "#anjay_ini_id_kh img",
    "[id*='anjay'] img",
    "#chimg-thumbs img",
    "#chimg img",
    ".chapter-image img",
    ".reader-area img",
    "#readerarea img",
  ];

  for (const selector of imageContainers) {
    $(selector).each((_, el) => {
      let src =
        $(el).attr("data-lazy-src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-cfsrc") ||
        $(el).attr("src");

      // Check onerror fallback
      if (!src || src.startsWith("data:image")) {
        const onerror = $(el).attr("onerror") || "";
        const match = onerror.match(/this\.src=['"]([^'"]+)['"]/);
        if (match) {
          src = match[1];
        }
      }

      const clean = cleanImageUrl(src);
      if (
        clean &&
        !clean.startsWith("data:image") &&
        !clean.includes("loader.gif") &&
        !clean.includes("blank.gif") &&
        !pages.includes(clean)
      ) {
        pages.push(clean);
      }
    });

    if (pages.length > 0) break;
  }

  // Next / Prev navigation
  let prevChapterSlug: string | null = null;
  let nextChapterSlug: string | null = null;

  const prevLink = $(".nextprev a[rel='prev'], .nav-links a:contains('Prev'), a.prev, .ch-prev-btn").attr("href");
  if (prevLink) {
    prevChapterSlug = extractSlugFromUrl(prevLink);
  }

  const nextLink = $(".nextprev a[rel='next'], .nav-links a:contains('Next'), a.next, .ch-next-btn").attr("href");
  if (nextLink) {
    nextChapterSlug = extractSlugFromUrl(nextLink);
  }

  return {
    comicSlug,
    chapterSlug,
    title: title || chapterSlug,
    pages,
    prevChapterSlug,
    nextChapterSlug,
  };
}
