import { NextRequest, NextResponse } from "next/server";
import { getChapterPages } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chapter = searchParams.get("chapter");

  if (!chapter || !/^[a-zA-Z0-9_\-\.\/]+$/.test(chapter) || chapter.length > 200) {
    return NextResponse.json({ error: "Invalid 'chapter' query parameter" }, { status: 400 });
  }

  try {
    const pagesData = await getChapterPages(chapter);
    return NextResponse.json(pagesData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Chapter pages error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch chapter pages" },
      { status: 500 }
    );
  }
}
