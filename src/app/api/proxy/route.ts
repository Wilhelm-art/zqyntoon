/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const isPrivateIpOrHost = (hostname: string) => {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') return true;
  if (hostname === '169.254.169.254') return true; // Cloud metadata
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
};

const isAllowedHost = (hostname: string) => {
  if (isPrivateIpOrHost(hostname)) return false;

  const allowedDirectDomains = [
    'api.mangadex.org',
    'uploads.mangadex.org',
    'bacakomik.my',
    'meo.comick.pictures',
  ];

  if (allowedDirectDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return true;
  }

  // MangaDex image network
  if (hostname.endsWith('.mangadex.network')) return true;

  // WordPress Photon CDN (used by Bacakomik covers: i0.wp.com, i2.wp.com)
  if (hostname.endsWith('.wp.com')) return true;

  // Comic chapter image CDNs used by Indonesian scanlations
  if (
    hostname.endsWith('.lol') ||
    hostname.endsWith('.lat') ||
    hostname.endsWith('.pics') ||
    hostname.endsWith('.komikcdn.me')
  ) {
    return true;
  }

  return false;
};

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

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    if (!isAllowedHost(urlObj.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // at-home/server URLs return time-limited CDN tokens — must NOT be cached
    const isAtHomeRequest = urlObj.pathname.includes('/at-home/server/');
    const isCoverImage = urlObj.hostname === 'uploads.mangadex.org' || urlObj.hostname.includes('wp.com');

    // Context-aware Referer to bypass anti-hotlinking
    const headers: Record<string, string> = {
      'Accept': 'application/json, image/avif, image/webp, image/apng, image/*, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    };

    if (
      urlObj.hostname.includes('bacakomik') ||
      urlObj.hostname.includes('wp.com') ||
      urlObj.hostname.endsWith('.lol') ||
      urlObj.hostname.endsWith('.lat') ||
      urlObj.hostname.endsWith('.pics')
    ) {
      headers['Referer'] = 'https://bacakomik.my/';
      headers['Origin'] = 'https://bacakomik.my';
    } else if (urlObj.hostname.includes('comick')) {
      headers['Referer'] = 'https://comick.io/';
      headers['Origin'] = 'https://comick.io';
    } else if (urlObj.hostname.includes('mangadex')) {
      headers['Referer'] = 'https://mangadex.org/';
      headers['Origin'] = 'https://mangadex.org';
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      ...(isAtHomeRequest
        ? { cache: 'no-store' }
        : { next: { revalidate: isCoverImage ? 86400 : 3600 } }),
    });

    if (!response.ok) {
      const text = await response.text();
      let body: any;
      try { body = JSON.parse(text); } catch { body = { error: text }; }
      return NextResponse.json(body, { status: response.status });
    }

    const contentType = response.headers.get('content-type') ?? '';

    // Image response — return raw buffer with correct content-type + cache
    if (contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
      });
    }

    // JSON response
    const data = await response.json();
    return NextResponse.json(data, {
      headers: isAtHomeRequest
        ? { 'Cache-Control': 'no-store' }
        : { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed', result: 'error' }, { status: 500 });
  }
}
