import { NextRequest, NextResponse } from 'next/server';
import { getChapterPages } from '@/lib/scraper/bacakomik';

export async function GET(request: NextRequest) {
  try {
    const endpoint =
      request.nextUrl.searchParams.get('endpoint') ||
      request.nextUrl.searchParams.get('chapterSlug') ||
      request.nextUrl.searchParams.get('id');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint or chapterSlug' }, { status: 400 });
    }

    const pages = await getChapterPages(endpoint);
    
    return NextResponse.json({ pages }, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Scraper pages error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
