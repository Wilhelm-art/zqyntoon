/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'api.mangadex.org',
  'uploads.mangadex.org',
  'cmdxd98sb0x3yprd.mangadex.network' // Often used by at-home/server
];

export async function GET(request: NextRequest) {
  try {
    const targetUrl = request.nextUrl.searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    try {
      const urlObj = new URL(targetUrl);
      const isAllowed = ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.mangadex.network') || urlObj.hostname.endsWith('.mangadex.org')
      );
      
      if (!isAllowed) {
        return NextResponse.json({ error: 'Domain not allowed in proxy whitelist' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZynqToon/1.0',
      },
      next: { revalidate: 60 }
    });

    const contentType = response.headers.get('content-type');
    
    // If it's an image, return the raw buffer
    if (contentType && contentType.startsWith('image/')) {
       const buffer = await response.arrayBuffer();
       return new NextResponse(buffer, {
         headers: {
           'Content-Type': contentType,
           'Cache-Control': 'public, max-age=86400', // cache for 1 day
         }
       });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
