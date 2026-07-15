import { NextRequest, NextResponse } from 'next/server';
import { getChapters } from '@/lib/scraper/bacakomik';

export async function GET(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const chapters = await getChapters(endpoint);
    
    return NextResponse.json({ chapters }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Scraper chapters error:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
