import { NextRequest, NextResponse } from "next/server";
import { searchComics } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const query = q.trim().slice(0, 100);

  if (!query) {
    return NextResponse.json({ comics: [] });
  }

  try {
    const comics = await searchComics(query);
    return NextResponse.json({ comics }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Search comics error:", error?.message);
    return NextResponse.json(
      { error: "Failed to search comics" },
      { status: 500 }
    );
  }
}
