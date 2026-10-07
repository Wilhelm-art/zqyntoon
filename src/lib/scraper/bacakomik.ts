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
  id: string; // chapter ID
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

function getMangaTitle(attributes: any): string {
  if (!attributes?.title) return "Komik";
  return (
    attributes.title.id ||
    attributes.title.en ||
    Object.values(attributes.title)[0] ||
    "Komik"
  );
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

/**
 * Get latest chapter releases with priority on Indonesian
 */
export async function getLatestComics(page: number = 1): Promise<{ comics: ComicItem[]; hasNextPage: boolean }> {
  try {
    const limit = 24;
    const offset = (page - 1) * limit;

    const res = await fetch(
      `${MD_BASE}/chapter?translatedLanguage[]=id&order[readableAt]=desc&limit=${limit}&offset=${offset}&includes[]=manga&includes[]=scanlation_group`,
      {
        headers: {
          "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
        },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error(`MangaDex returned ${res.status}`);
    }

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
        ? new Date(ch.attributes.readableAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          })
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
            if (coverMap.has(c.slug)) {
              c.cover = coverMap.get(c.slug)!;
            }
          }
        }
      } catch {
        // Safe fallback
      }
    }

    const hasNextPage = (json.total || 0) > offset + limit;
    return { comics, hasNextPage };
  } catch (err: any) {
    console.error("getLatestComics error:", err.message);
    return { comics: [], hasNextPage: false };
  }
}

/**
 * Get popular comics in Indonesian
 */
export async function getPopularComics(page: number = 1): Promise<ComicItem[]> {
  try {
    const limit = 24;
    const offset = (page - 1) * limit;

    const res = await fetch(
      `${MD_BASE}/manga?availableTranslatedLanguage[]=id&limit=${limit}&offset=${offset}&order[followedCount]=desc&includes[]=cover_art`,
      {
        headers: {
          "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
        },
        next: { revalidate: 600 },
      }
    );

    if (!res.ok) {
      throw new Error(`MangaDex returned ${res.status}`);
    }

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
  } catch (err: any) {
    console.error("getPopularComics error:", err.message);
    return [];
  }
}

/**
 * Search comics with Indonesian translation
 */
export async function searchComics(query: string): Promise<ComicItem[]> {
  try {
    const res = await fetch(
      `${MD_BASE}/manga?title=${encodeURIComponent(query)}&availableTranslatedLanguage[]=id&limit=20&includes[]=cover_art`,
      {
        headers: {
          "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
        },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error(`MangaDex returned ${res.status}`);
    }

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
  } catch (err: any) {
    console.error("searchComics error:", err.message);
    return [];
  }
}

/**
 * Get detailed metadata and all chapters sequentially (Indonesian with smart fallback)
 */
export async function getComicDetail(mangaId: string): Promise<ComicDetail> {
  // 1. Fetch Manga Metadata
  const mangaRes = await fetch(
    `${MD_BASE}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`,
    {
      headers: {
        "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
      },
      next: { revalidate: 600 },
    }
  );

  if (!mangaRes.ok) {
    throw new Error(`Failed to fetch manga detail: ${mangaRes.status}`);
  }

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

  // 2. Fetch Chapters: First prioritize Indonesian (id), fallback to all if empty
  let feedRes = await fetch(
    `${MD_BASE}/manga/${mangaId}/feed?translatedLanguage[]=id&order[chapter]=desc&limit=500`,
    {
      headers: {
        "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
      },
      next: { revalidate: 300 },
    }
  );

  let feedJson = await feedRes.json();
  let rawChapters = feedJson.data || [];

  // Fallback to all available languages if Indonesian feed is empty for this title
  if (rawChapters.length === 0) {
    feedRes = await fetch(
      `${MD_BASE}/manga/${mangaId}/feed?order[chapter]=desc&limit=500`,
      {
        headers: {
          "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
        },
        next: { revalidate: 300 },
      }
    );
    feedJson = await feedRes.json();
    rawChapters = feedJson.data || [];
  }

  // Deduplicate and sort chapters sequentially
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

/**
 * Get chapter image pages for the internal reader
 */
export async function getChapterPages(chapterId: string): Promise<ChapterPagesResult> {
  const chMetaRes = await fetch(`${MD_BASE}/chapter/${chapterId}?includes[]=manga`, {
    headers: {
      "User-Agent": "ZqynToon/2.0 (https://zynqtoon.vercel.app)",
    },
    next: { revalidate: 600 },
  });

  if (!chMetaRes.ok) {
    throw new Error(`Chapter not found: ${chMetaRes.status}`);
  }

  const chMetaJson = await chMetaRes.json();
  const chData = chMetaJson.data;
  const mangaRel = chData.relationships?.find((r: any) => r.type === "manga");
  const comicSlug = mangaRel?.id || "";

  const chNum = chData.attributes.chapter ? `Chapter ${chData.attributes.chapter}` : "Chapter";
  const title = chData.attributes.title ? `${chNum} - ${chData.attributes.title}` : chNum;

  // Fetch Image Pages via MangaDex At-Home server
  const atHomeRes = await fetch(`${MD_BASE}/at-home/server/${chapterId}`);
  if (!atHomeRes.ok) {
    throw new Error(`Failed to fetch pages: ${atHomeRes.status}`);
  }

  const atHomeJson = await atHomeRes.json();
  const baseUrl = atHomeJson.baseUrl;
  const hash = atHomeJson.chapter?.hash;
  const pageFiles = atHomeJson.chapter?.data || [];

  const pages = pageFiles.map((filename: string) => `${baseUrl}/data/${hash}/${filename}`);

  // Find Next and Previous chapters in sequence
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
        if (currentIndex > 0) {
          prevChapterSlug = sortedList[currentIndex - 1].id;
        }
        if (currentIndex >= 0 && currentIndex < sortedList.length - 1) {
          nextChapterSlug = sortedList[currentIndex + 1].id;
        }
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
