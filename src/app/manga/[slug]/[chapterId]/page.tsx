import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChapterPages, getComicDetail } from "@/lib/scraper/bacakomik";
import { ReaderView } from "@/components/ReaderView";

interface ChapterPageProps {
  params: Promise<{
    slug: string;
    chapterId: string;
  }>;
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { slug, chapterId } = await params;
  try {
    const [chapterData, comic] = await Promise.all([
      getChapterPages(chapterId),
      getComicDetail(slug).catch(() => undefined),
    ]);
    const title = `${chapterData.title} Bahasa Indonesia`;
    const description = `Baca komik ${chapterData.title} Bahasa Indonesia online di ZqynToon dengan kualitas HD dan reader internal tanpa gangguan.`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zynqtoon.web.id";
    const proxiedCover = comic?.cover
      ? `${siteUrl}/api/proxy?url=${encodeURIComponent(comic.cover)}`
      : `${siteUrl}/og-image.jpg`;

    const canonicalUrl = `${siteUrl}/manga/${slug}/${chapterId}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        type: "article",
        url: canonicalUrl,
        siteName: "ZqynToon",
        locale: "id_ID",
        images: [
          {
            url: proxiedCover,
            secureUrl: proxiedCover,
            alt: `${chapterData.title} Bahasa Indonesia - ZqynToon`,
            type: "image/jpeg",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [proxiedCover],
        site: "@zqyntoon",
        creator: "@zqyntoon",
      },
    };
  } catch {
    return {
      title: "Baca Chapter Komik",
    };
  }
}

export default async function ChapterReaderPage({ params }: ChapterPageProps) {
  const { slug, chapterId } = await params;

  let chapterData;
  let comicDetail;

  try {
    const [chRes, detailRes] = await Promise.all([
      getChapterPages(chapterId),
      getComicDetail(slug).catch(() => undefined),
    ]);
    chapterData = chRes;
    comicDetail = detailRes;
  } catch (err) {
    console.error("Failed to load chapter:", err);
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicIssue",
    name: chapterData.title,
    issueNumber: chapterId,
    isPartOf: {
      "@type": "ComicSeries",
      name: comicDetail?.title || slug,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ReaderView
        initialData={{
          ...chapterData,
          comicSlug: chapterData.comicSlug || slug,
        }}
        comicDetail={comicDetail}
      />
    </>
  );
}
