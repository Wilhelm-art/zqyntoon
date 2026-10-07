import { NextRequest, NextResponse } from "next/server";
import { getLatestComics } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isInteger(rawPage) ? Math.max(1, Math.min(rawPage, 100)) : 1;

  try {
    const data = await getLatestComics(page);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Latest comics error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch latest comics" },
      { status: 500 }
    );
  }
}
