import { NextRequest, NextResponse } from "next/server";
import { getComicDetail } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug || !/^[a-zA-Z0-9_\-\.]+$/.test(slug) || slug.length > 150) {
    return NextResponse.json({ error: "Invalid 'slug' query parameter" }, { status: 400 });
  }

  try {
    const detail = await getComicDetail(slug);
    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    });
  } catch (error: any) {
    console.error("Comic detail error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch comic detail" },
      { status: 500 }
    );
  }
}
