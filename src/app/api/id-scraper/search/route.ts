import { NextRequest, NextResponse } from "next/server";
import { searchComics } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ comics: [] });
  }

  try {
    const comics = await searchComics(q);
    return NextResponse.json({ comics }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to search comics", details: error?.message },
      { status: 500 }
    );
  }
}
