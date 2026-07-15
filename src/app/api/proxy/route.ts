/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'api.mangadex.org',
  'uploads.mangadex.org',
];

export async function GET(request: NextRequest) {
  try {
    const targetUrl = request.nextUrl.searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    let urlObj: URL;
    try {
      urlObj = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const isAllowed =
      ALLOWED_DOMAINS.some(domain => urlObj.hostname === domain) ||
      urlObj.hostname.endsWith('.mangadex.network') ||
      urlObj.hostname.endsWith('.mangadex.org');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // at-home/server URLs return time-limited CDN URLs — must NOT be cached
    const isAtHomeRequest = urlObj.pathname.includes('/at-home/server/');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, image/*, */*',
        'User-Agent': 'ZynqToon/1.0 (https://zynqtoon.vercel.app)',
      },
      // at-home server: no cache (time-limited tokens)
      // everything else: cache 60s
      ...(isAtHomeRequest
        ? { cache: 'no-store' }
        : { next: { revalidate: 60 } }),
    });

    if (!response.ok) {
      // Pass through MangaDex error responses so the client can read them
      const text = await response.text();
      let body: any;
      try { body = JSON.parse(text); } catch { body = { error: text }; }
      return NextResponse.json(body, { status: response.status });
    }

    const contentType = response.headers.get('content-type') ?? '';

    // Image response — return raw buffer with correct content-type
    if (contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // JSON response
    const data = await response.json();
    return NextResponse.json(data, {
      headers: isAtHomeRequest
        ? { 'Cache-Control': 'no-store' }
        : { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed', result: 'error' }, { status: 500 });
  }
}
