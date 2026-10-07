import { NextRequest, NextResponse } from "next/server";
import { getComicDetail } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing 'slug' query parameter" }, { status: 400 });
  }

  try {
    const detail = await getComicDetail(slug);
    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch comic detail", details: error?.message },
      { status: 500 }
    );
  }
}
