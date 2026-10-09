import * as cheerio from "cheerio";

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
  id: string; // chapter slug or UUID
  title: string;
  chapterNumber?: string;
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

const MD_BASE = "https://api.mangadex.org";
const KOMIKU_BASE = "https://komiku.org";
const KOMIKU_API = "https://api.komiku.org";
const KOMIKU_ANALYTICS = "https://analytics.komiku.org";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

function isUuid(str: string): boolean {
  return str.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Remove downscaling/letterboxing query params (?resize=240,150, quality=60, w=...)
 * so we get the full-resolution, uncropped 3:4 portrait cover artwork.
 */
function cleanCoverUrl(rawUrl: string): string {
  if (!rawUrl) return "/cover-placeholder.svg";
  let url = rawUrl.trim();
  if (url.startsWith("//")) url = "https:" + url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("komiku")) {
      parsed.searchParams.delete("resize");
      parsed.searchParams.delete("quality");
      parsed.searchParams.delete("w");
      return parsed.toString();
    }
  } catch {
    url = url
      .replace(/[?&]resize=[^&]+/g, "")
      .replace(/[?&]quality=[^&]+/g, "")
      .replace(/[?&]w=[^&]+/g, "");
  }

  return url;
}

/* =========================================================================
 * 1. KOMIKU SCRAPER ENGINE (Complete Indonesian Scanlations with All Chapters)
 * ========================================================================= */

async function fetchKomikuLatest(page: number = 1): Promise<{ comics: ComicItem[]; hasNextPage: boolean }> {
  const url = page > 1 ? `${KOMIKU_API}/manga/page/${page}/` : `${KOMIKU_API}/manga/`;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    throw new Error(`Komiku latest returned ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const comics: ComicItem[] = [];

  $(".bge").each((_, el) => {
    const link = $(el).find(".kan a").first().attr("href") || $(el).find(".bgei a").first().attr("href") || "";
    const slug = link.replace(/.*\/manga\//, "").replace(/\/$/, "");
    const title = $(el).find("h3").first().text().trim();
    const rawCover = $(el).find("img").first().attr("src") || "";
    const cover = cleanCoverUrl(rawCover);

    const type = $(el).find(".tpe1_inf b").first().text().trim() || "Manga";
    const latestA = $(el).find(".new1 a").last();
    const latestChapter = latestA.text().replace("Terbaru: ", "").trim();
    const latestChapterHref = latestA.attr("href") || "";
    const latestChapterSlug = latestChapterHref.replace(/^\//, "").replace(/\/$/, "");

    if (slug && title) {
      comics.push({
        slug,
        title,
        cover,
        type,
        latestChapter,
        latestChapterSlug,
        updatedAt: "Baru",
      });
    }
  });

  return { comics, hasNextPage: comics.length >= 10 };
}

async function resolveSeriesSlug(redirectHref: string, fallbackTitle: string): Promise<string> {
  const match = redirectHref.match(/idSeries=(\d+)/);
  if (!match) return slugify(fallbackTitle);

  try {
    const res = await fetch(`${KOMIKU_BASE}/p/redirect/?idSeries=${match[1]}`, {
      redirect: "manual",
      headers: DEFAULT_HEADERS,
      next: { revalidate: 86400 },
    });
    const loc = res.headers.get("location");
    if (loc) {
      const slugMatch = loc.match(/\/manga\/([^\/]+)\//);
      if (slugMatch) return slugMatch[1];
    }
  } catch {
    // Ignore and fallback
  }

  return slugify(fallbackTitle);
}

async function fetchKomikuPopular(): Promise<ComicItem[]> {
  const url = `${KOMIKU_ANALYTICS}/api/popular/active/?format=html&template=trending-page&limit=40`;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`Komiku analytics returned ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const rawList: { title: string; cover: string; redirectHref: string; slug: string }[] = [];

  $("article.ls2").each((_, el) => {
    const title = $(el).find("h3 a").text().trim();
    const rawCover = $(el).find("img").attr("src") || "";
    const cover = cleanCoverUrl(rawCover);
    const redirectHref = $(el).find("a[href*='idSeries']").first().attr("href") || "";

    let slug = "";
    const match = cover.match(/\/uploads\/manga\/([^\/]+)\//);
    if (match) {
      slug = match[1];
    }

    if (title) {
      rawList.push({ title, cover, redirectHref, slug });
    }
  });

  // Resolve unresolved slugs concurrently
  const comics: ComicItem[] = await Promise.all(
    rawList.map(async (item) => {
      let finalSlug = item.slug;
      if (!finalSlug) {
        finalSlug = await resolveSeriesSlug(item.redirectHref, item.title);
      }
      return {
        slug: finalSlug,
        title: item.title,
        cover: item.cover,
        type: "Manga",
        rating: "4.9",
      };
    })
  );

  return comics;
}

async function fetchKomikuSearch(query: string): Promise<ComicItem[]> {
  const url = `${KOMIKU_API}/manga/?s=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    return [];
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const comics: ComicItem[] = [];

  $(".bge").each((_, el) => {
    const link = $(el).find(".kan a").first().attr("href") || $(el).find(".bgei a").first().attr("href") || "";
    const slug = link.replace(/.*\/manga\//, "").replace(/\/$/, "");
    const title = $(el).find("h3").first().text().trim();
    const rawCover = $(el).find("img").first().attr("src") || "";
    const cover = cleanCoverUrl(rawCover);

    const type = $(el).find(".tpe1_inf b").first().text().trim() || "Manga";
    const latestA = $(el).find(".new1 a").last();
    const latestChapter = latestA.text().replace("Terbaru: ", "").trim();
    const latestChapterHref = latestA.attr("href") || "";
    const latestChapterSlug = latestChapterHref.replace(/^\//, "").replace(/\/$/, "");

    if (slug && title) {
      comics.push({
        slug,
        title,
        cover,
        type,
        latestChapter,
        latestChapterSlug,
      });
    }
  });

  return comics;
}

async function fetchKomikuDetail(slug: string): Promise<ComicDetail> {
  const url = `${KOMIKU_BASE}/manga/${slug}/`;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Komiku detail returned ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  let title = "";
  let alternativeTitle = "";
  let type = "Manga";
  let author = "";
  let status = "Ongoing";

  $("table.inftable tr").each((_, tr) => {
    const label = $(tr).find("td").first().text().trim();
    const val = $(tr).find("td").last().text().trim();
    if (label.startsWith("Judul:")) title = val;
    else if (label.startsWith("Judul Alternatif:")) alternativeTitle = val;
    else if (label.startsWith("Tipe:")) type = val;
    else if (label.startsWith("Author:")) author = val;
    else if (label.startsWith("Status:")) status = val === "End" ? "Completed" : "Ongoing";
  });

  if (!title) {
    title = $("#Judul h1").text().replace(/^Komik\s+/i, "").trim() || slug;
  }

  const rawCover =
    $("section#Informasi img[itemprop='image']").attr("src") ||
    $("section#Informasi img").first().attr("src") ||
    "/cover-placeholder.svg";
  const cover = cleanCoverUrl(rawCover);

  const synopsis =
    $("p.desc, section#Informasi p").first().text().trim() ||
    $("#Sinopsis p").text().trim() ||
    `Baca komik ${title} Bahasa Indonesia lengkap.`;

  const genres: string[] = [];
  $("ul.genre li.genre a span").each((_, el) => {
    const g = $(el).text().trim();
    if (g && !genres.includes(g)) genres.push(g);
  });

  const chapters: ChapterItem[] = [];
  $("#Daftar_Chapter tr").each((_, tr) => {
    const a = $(tr).find("td.judulseries a");
    if (a.length > 0) {
      const href = a.attr("href") || "";
      const chTitle = a.text().trim();
      const date = $(tr).find("td.tanggalseries").text().trim();
      const chSlug = href.replace(/^\//, "").replace(/\/$/, "");

      const numMatch = chTitle.match(/Chapter\s+([\d.]+)/i);
      const chNum = numMatch ? numMatch[1] : undefined;

      chapters.push({
        id: chSlug,
        title: chTitle,
        chapterNumber: chNum,
        releaseDate: date || undefined,
      });
    }
  });

  return {
    slug,
    title,
    alternativeTitle,
    cover,
    synopsis,
    type,
    status,
    author: author || undefined,
    rating: "4.9",
    genres,
    chapters,
  };
}

async function fetchKomikuChapter(chapterSlug: string): Promise<ChapterPagesResult> {
  const url = `${KOMIKU_BASE}/${chapterSlug}/`;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`Komiku chapter returned ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const rawTitle = $("h1.entry-title, h1, #Judul h1").first().text().trim();
  const title = rawTitle.replace(/\s+/g, " ") || chapterSlug;

  // Extract comic slug from breadcrumbs or link_series in script
  let comicSlug = "";
  const seriesLink = $("a[href*='/manga/']").first().attr("href");
  if (seriesLink) {
    comicSlug = seriesLink.replace(/.*\/manga\//, "").replace(/\/$/, "");
  }

  // Extract image pages
  const pages: string[] = [];
  $("#Baca_Komik img").each((_, el) => {
    let src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (
      src &&
      !src.includes("promosi") &&
      !src.includes("promooktober") &&
      !src.includes("banner") &&
      !src.includes("iklan") &&
      !src.includes("logo") &&
      !src.includes("lazy.jpg")
    ) {
      if (src.startsWith("//")) src = "https:" + src;
      pages.push(src);
    }
  });

  // Next & Prev navigation
  let prevChapterSlug: string | null = null;
  let nextChapterSlug: string | null = null;

  const prevLink = $("a[aria-label='Prev'], a.btn:contains('Prev')").first().attr("href");
  if (prevLink) {
    prevChapterSlug = prevLink.replace(/.*komiku\.org\//, "").replace(/^\//, "").replace(/\/$/, "");
  }

  const nextLink = $("a[aria-label='Next'], a.btn:contains('Next')").first().attr("href");
  if (nextLink) {
    nextChapterSlug = nextLink.replace(/.*komiku\.org\//, "").replace(/^\//, "").replace(/\/$/, "");
  }

  return {
    comicSlug,
    chapterSlug,
    title,
    pages,
    prevChapterSlug,
    nextChapterSlug,
  };
}

/* =========================================================================
 * 2. MANGADEX ENGINE (High-Definition Catalog & Global Fallback)
 * ========================================================================= */

function getMangaTitle(attributes: any): string {
  if (!attributes?.title) return "Komik";
  return attributes.title.id || attributes.title.en || Object.values(attributes.title)[0] || "Komik";
}

function getMangaDescription(attributes: any): string {
  if (!attributes?.description) return "";
  return attributes.description.id || attributes.description.en || Object.values(attributes.description)[0] || "";
}

function determineComicType(tags: any[]): string {
  for (const t of tags || []) {
    const name = t.attributes?.name?.en?.toLowerCase();
    if (name === "manhwa") return "Manhwa";
    if (name === "manhua") return "Manhua";
  }
  return "Manga";
}

async function fetchMangaDexLatest(page: number = 1): Promise<{ comics: ComicItem[]; hasNextPage: boolean }> {
  const limit = 24;
  const offset = (page - 1) * limit;

  const res = await fetch(
    `${MD_BASE}/chapter?translatedLanguage[]=id&order[readableAt]=desc&limit=${limit}&offset=${offset}&includes[]=manga&includes[]=scanlation_group`,
    {
      headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
      next: { revalidate: 120 },
    }
  );

  if (!res.ok) throw new Error(`MangaDex returned ${res.status}`);

  const json = await res.json();
  const comics: ComicItem[] = [];
  const seenManga = new Set<string>();

  for (const ch of json.data || []) {
    const mangaRel = ch.relationships?.find((r: any) => r.type === "manga");
    if (!mangaRel || seenManga.has(mangaRel.id)) continue;
    seenManga.add(mangaRel.id);

    const title = getMangaTitle(mangaRel.attributes);
    const chNumber = ch.attributes.chapter ? `Ch. ${ch.attributes.chapter}` : "Chapter Baru";
    const chTitle = ch.attributes.title ? `${chNumber}: ${ch.attributes.title}` : chNumber;
    const releaseDate = ch.attributes.readableAt
      ? new Date(ch.attributes.readableAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
      : "Baru";

    comics.push({
      slug: mangaRel.id,
      title,
      cover: "/cover-placeholder.svg",
      type: determineComicType(mangaRel.attributes?.tags),
      latestChapter: chTitle,
      latestChapterSlug: ch.id,
      updatedAt: releaseDate,
    });
  }

  // Fetch covers in bulk
  const mangaIds = comics.map((c) => c.slug);
  if (mangaIds.length > 0) {
    try {
      const coverRes = await fetch(
        `${MD_BASE}/cover?${mangaIds.map((id) => `manga[]=${id}`).join("&")}&limit=100`,
        { next: { revalidate: 3600 } }
      );
      if (coverRes.ok) {
        const coverJson = await coverRes.json();
        const coverMap = new Map<string, string>();
        for (const c of coverJson.data || []) {
          const mId = c.relationships?.find((r: any) => r.type === "manga")?.id;
          if (mId && c.attributes?.fileName) {
            coverMap.set(mId, `https://uploads.mangadex.org/covers/${mId}/${c.attributes.fileName}.512.jpg`);
          }
        }
        for (const c of comics) {
          if (coverMap.has(c.slug)) c.cover = coverMap.get(c.slug)!;
        }
      }
    } catch {
      // Safe fallback
    }
  }

  return { comics, hasNextPage: (json.total || 0) > offset + limit };
}

async function fetchMangaDexPopular(page: number = 1): Promise<ComicItem[]> {
  const limit = 24;
  const offset = (page - 1) * limit;

  const res = await fetch(
    `${MD_BASE}/manga?availableTranslatedLanguage[]=id&limit=${limit}&offset=${offset}&order[followedCount]=desc&includes[]=cover_art`,
    {
      headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
      next: { revalidate: 600 },
    }
  );

  if (!res.ok) throw new Error(`MangaDex returned ${res.status}`);

  const json = await res.json();
  const comics: ComicItem[] = [];

  for (const m of json.data || []) {
    const title = getMangaTitle(m.attributes);
    const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
    const coverUrl = coverRel?.attributes?.fileName
      ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.512.jpg`
      : "/cover-placeholder.svg";

    comics.push({
      slug: m.id,
      title,
      cover: coverUrl,
      type: determineComicType(m.attributes?.tags),
      rating: "4.9",
    });
  }

  return comics;
}

async function fetchMangaDexSearch(query: string): Promise<ComicItem[]> {
  const res = await fetch(
    `${MD_BASE}/manga?title=${encodeURIComponent(query)}&availableTranslatedLanguage[]=id&limit=20&includes[]=cover_art`,
    {
      headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
      next: { revalidate: 120 },
    }
  );

  if (!res.ok) return [];

  const json = await res.json();
  const comics: ComicItem[] = [];

  for (const m of json.data || []) {
    const title = getMangaTitle(m.attributes);
    const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
    const coverUrl = coverRel?.attributes?.fileName
      ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.512.jpg`
      : "/cover-placeholder.svg";

    comics.push({
      slug: m.id,
      title,
      cover: coverUrl,
      type: determineComicType(m.attributes?.tags),
    });
  }

  return comics;
}

async function fetchMangaDexDetail(mangaId: string): Promise<ComicDetail> {
  const mangaRes = await fetch(
    `${MD_BASE}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`,
    {
      headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
      next: { revalidate: 600 },
    }
  );

  if (!mangaRes.ok) throw new Error(`MangaDex returned ${mangaRes.status}`);

  const mangaJson = await mangaRes.json();
  const m = mangaJson.data;
  const title = getMangaTitle(m.attributes);
  const synopsis = getMangaDescription(m.attributes);
  const status = m.attributes.status === "completed" ? "Completed" : "Ongoing";

  const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
  const coverUrl = coverRel?.attributes?.fileName
    ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.512.jpg`
    : "/cover-placeholder.svg";

  const authorRel = m.relationships?.find((r: any) => r.type === "author");
  const artistRel = m.relationships?.find((r: any) => r.type === "artist");

  const genres: string[] = (m.attributes.tags || [])
    .map((t: any) => t.attributes?.name?.en)
    .filter(Boolean);

  let feedRes = await fetch(
    `${MD_BASE}/manga/${mangaId}/feed?translatedLanguage[]=id&order[chapter]=desc&limit=500`,
    {
      headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
      next: { revalidate: 300 },
    }
  );

  let feedJson = await feedRes.json();
  let rawChapters = feedJson.data || [];

  if (rawChapters.length === 0) {
    feedRes = await fetch(`${MD_BASE}/manga/${mangaId}/feed?order[chapter]=desc&limit=500`, {
      headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
      next: { revalidate: 300 },
    });
    feedJson = await feedRes.json();
    rawChapters = feedJson.data || [];
  }

  const seenChapters = new Set<string>();
  const chapters: ChapterItem[] = [];

  for (const ch of rawChapters) {
    const chNum = ch.attributes.chapter || "Oneshot";
    if (seenChapters.has(chNum)) continue;
    seenChapters.add(chNum);

    const chTitleText = ch.attributes.title
      ? `Chapter ${chNum} - ${ch.attributes.title}`
      : `Chapter ${chNum}`;

    const releaseDate = ch.attributes.readableAt
      ? new Date(ch.attributes.readableAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : undefined;

    chapters.push({
      id: ch.id,
      title: chTitleText,
      chapterNumber: chNum,
      releaseDate,
    });
  }

  return {
    slug: mangaId,
    title,
    cover: coverUrl,
    synopsis,
    type: determineComicType(m.attributes.tags),
    status,
    author: authorRel?.attributes?.name,
    artist: artistRel?.attributes?.name,
    rating: "4.9",
    genres,
    chapters,
  };
}

async function fetchMangaDexChapter(chapterId: string): Promise<ChapterPagesResult> {
  const chMetaRes = await fetch(`${MD_BASE}/chapter/${chapterId}?includes[]=manga`, {
    headers: { "User-Agent": "ZqynToon/2.0 (https://zynqtoon.web.id)" },
    next: { revalidate: 600 },
  });

  if (!chMetaRes.ok) throw new Error(`Chapter not found: ${chMetaRes.status}`);

  const chMetaJson = await chMetaRes.json();
  const chData = chMetaJson.data;
  const mangaRel = chData.relationships?.find((r: any) => r.type === "manga");
  const comicSlug = mangaRel?.id || "";

  const chNum = chData.attributes.chapter ? `Chapter ${chData.attributes.chapter}` : "Chapter";
  const title = chData.attributes.title ? `${chNum} - ${chData.attributes.title}` : chNum;

  const atHomeRes = await fetch(`${MD_BASE}/at-home/server/${chapterId}`);
  if (!atHomeRes.ok) throw new Error(`Failed to fetch pages: ${atHomeRes.status}`);

  const atHomeJson = await atHomeRes.json();
  const baseUrl = atHomeJson.baseUrl;
  const hash = atHomeJson.chapter?.hash;
  const pageFiles = atHomeJson.chapter?.data || [];

  const pages = pageFiles.map((filename: string) => `${baseUrl}/data/${hash}/${filename}`);

  let prevChapterSlug: string | null = null;
  let nextChapterSlug: string | null = null;

  if (comicSlug) {
    try {
      const feedRes = await fetch(
        `${MD_BASE}/manga/${comicSlug}/feed?order[chapter]=asc&limit=500`,
        { next: { revalidate: 600 } }
      );
      if (feedRes.ok) {
        const feedJson = await feedRes.json();
        const sortedList = feedJson.data || [];
        const currentIndex = sortedList.findIndex((c: any) => c.id === chapterId);
        if (currentIndex > 0) prevChapterSlug = sortedList[currentIndex - 1].id;
        if (currentIndex >= 0 && currentIndex < sortedList.length - 1)
          nextChapterSlug = sortedList[currentIndex + 1].id;
      }
    } catch {
      // Ignore
    }
  }

  return {
    comicSlug,
    chapterSlug: chapterId,
    title,
    pages,
    prevChapterSlug,
    nextChapterSlug,
  };
}

/* =========================================================================
 * 3. UNIFIED HYBRID EXPORTS (Komiku Primary + MangaDex Fallback)
 * ========================================================================= */

/**
 * Get latest comic releases in Indonesian
 */
export async function getLatestComics(page: number = 1): Promise<{ comics: ComicItem[]; hasNextPage: boolean }> {
  try {
    const komikuRes = await fetchKomikuLatest(page);
    if (komikuRes.comics.length > 0) return komikuRes;
  } catch (err: any) {
    console.warn("Komiku latest fallback triggered:", err.message);
  }

  try {
    return await fetchMangaDexLatest(page);
  } catch (err: any) {
    console.error("MangaDex latest error:", err.message);
    return { comics: [], hasNextPage: false };
  }
}

/**
 * Get popular/trending comics in Indonesian
 */
export async function getPopularComics(page: number = 1): Promise<ComicItem[]> {
  try {
    const komikuList = await fetchKomikuPopular();
    if (komikuList.length > 0) return komikuList;
  } catch (err: any) {
    console.warn("Komiku popular fallback triggered:", err.message);
  }

  try {
    return await fetchMangaDexPopular(page);
  } catch (err: any) {
    console.error("MangaDex popular error:", err.message);
    return [];
  }
}

/**
 * Search comics across both Komiku & MangaDex
 */
export async function searchComics(query: string): Promise<ComicItem[]> {
  const [komikuResults, mangadexResults] = await Promise.all([
    fetchKomikuSearch(query).catch(() => []),
    fetchMangaDexSearch(query).catch(() => []),
  ]);

  const seenSlugs = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: ComicItem[] = [];

  // Prioritize Komiku results (they have complete chapters 1..N)
  for (const c of komikuResults) {
    const normTitle = c.title.toLowerCase().trim();
    if (!seenSlugs.has(c.slug) && !seenTitles.has(normTitle)) {
      seenSlugs.add(c.slug);
      seenTitles.add(normTitle);
      merged.push(c);
    }
  }

  // Add remaining MangaDex results
  for (const c of mangadexResults) {
    const normTitle = c.title.toLowerCase().trim();
    if (!seenSlugs.has(c.slug) && !seenTitles.has(normTitle)) {
      seenSlugs.add(c.slug);
      seenTitles.add(normTitle);
      merged.push(c);
    }
  }

  return merged;
}

/**
 * Get detailed metadata and complete sequential chapters
 */
export async function getComicDetail(slug: string): Promise<ComicDetail> {
  if (isUuid(slug)) {
    return await fetchMangaDexDetail(slug);
  }

  try {
    return await fetchKomikuDetail(slug);
  } catch (err: any) {
    console.warn(`Komiku detail failed for ${slug}, attempting MangaDex fallback:`, err.message);
    const searchRes = await fetchMangaDexSearch(slug.replace(/-/g, " "));
    if (searchRes.length > 0) {
      return await fetchMangaDexDetail(searchRes[0].slug);
    }
    throw err;
  }
}

/**
 * Get chapter image pages for the internal reader
 */
export async function getChapterPages(chapterSlug: string): Promise<ChapterPagesResult> {
  if (isUuid(chapterSlug)) {
    return await fetchMangaDexChapter(chapterSlug);
  }

  return await fetchKomikuChapter(chapterSlug);
}
