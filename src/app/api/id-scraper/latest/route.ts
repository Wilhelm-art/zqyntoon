import { NextRequest, NextResponse } from "next/server";
import { getLatestComics } from "@/lib/scraper/bacakomik";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    const data = await getLatestComics(page);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch latest comics", details: error?.message },
      { status: 500 }
    );
  }
}
