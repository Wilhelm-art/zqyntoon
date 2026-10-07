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
    const chapterData = await getChapterPages(chapterId);
    const title = `${chapterData.title} Bahasa Indonesia | ZqynToon`;
    const description = `Baca komik ${chapterData.title} Bahasa Indonesia online di ZqynToon dengan kualitas HD dan reader internal tanpa gangguan.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
    };
  } catch {
    return {
      title: "Baca Chapter Komik | ZqynToon",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
