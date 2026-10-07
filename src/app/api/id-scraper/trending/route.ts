import { NextResponse } from "next/server";
import { getPopularComics } from "@/lib/scraper/bacakomik";

export async function GET() {
  try {
    const comics = await getPopularComics();
    return NextResponse.json({ comics }, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error: any) {
    console.error("Trending comics error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch popular comics" },
      { status: 500 }
    );
  }
}
