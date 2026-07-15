import { NextRequest, NextResponse } from 'next/server';
import { getChaptersEN } from '@/lib/scraper/consumet';

export async function GET(request: NextRequest) {
  try {
    const mangaId = request.nextUrl.searchParams.get('mangaId');
    if (!mangaId) {
      return NextResponse.json({ error: 'Missing mangaId' }, { status: 400 });
    }

    const chapters = await getChaptersEN(mangaId);
    
    return NextResponse.json({ chapters }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Consumet chapters error:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
