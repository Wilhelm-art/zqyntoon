import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const targetUrl = request.nextUrl.searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZynqToon/1.0',
      },
      next: { revalidate: 60 }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MangaDex proxy error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
