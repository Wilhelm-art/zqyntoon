import { NextRequest, NextResponse } from 'next/server';
import { getComicDetail } from '@/lib/scraper/bacakomik';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const detail = await getComicDetail(slug);

    return NextResponse.json(detail, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('ID Scraper detail error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch comic details' },
      { status: 404 }
    );
  }
}
