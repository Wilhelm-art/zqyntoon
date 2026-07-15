import { NextRequest, NextResponse } from 'next/server';
import { getPages } from '@/lib/scraper/bacakomik';

export async function GET(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const pages = await getPages(endpoint);
    
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
