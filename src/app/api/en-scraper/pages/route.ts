import { NextRequest, NextResponse } from 'next/server';
import { getPagesEN } from '@/lib/scraper/consumet';

export async function GET(request: NextRequest) {
  try {
    const chapterId = request.nextUrl.searchParams.get('chapterId');
    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });
    }

    const pages = await getPagesEN(chapterId);
    
    return NextResponse.json({ pages }, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Consumet pages error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
