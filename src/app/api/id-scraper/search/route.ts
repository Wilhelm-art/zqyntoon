import { NextRequest, NextResponse } from 'next/server';
import { searchManga } from '@/lib/scraper/komikcast';

export async function GET(request: NextRequest) {
  try {
    const title = request.nextUrl.searchParams.get('title');
    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    const results = await searchManga(title);
    
    return NextResponse.json({ results }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Scraper search error:', error);
    return NextResponse.json({ error: 'Failed to search manga' }, { status: 500 });
  }
}
