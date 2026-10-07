/**
 * ZynqToon - Cloudflare Edge Worker for Manga Image Proxy & CDN Accelerator
 * - Bypasses anti-hotlinking with upstream-specific Referer & User-Agent
 * - Caches images on Cloudflare 300+ Edge POPs for 30 days (0 bandwidth server cost)
 * - Returns permissive CORS headers for web readers
 */

const ALLOWED_TARGET_HOSTS = [
  'uploads.mangadex.org',
  'api.sansekai.my.id',
  'meo.comick.pictures',
  'bacakomik.my',
];

function isHostAllowed(hostname) {
  return (
    ALLOWED_TARGET_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`)) ||
    hostname.endsWith('.mangadex.network') ||
    hostname.endsWith('.bacakomik.my')
  );
}

function getRefererForHost(hostname) {
  if (hostname.includes('mangadex')) return 'https://mangadex.org/';
  if (hostname.includes('comick')) return 'https://comick.io/';
  if (hostname.includes('bacakomik')) return 'https://bacakomik.my/';
  if (hostname.includes('komiku')) return 'https://komiku.id/';
  if (hostname.includes('komikcast')) return 'https://komikcast.bz/';
  return 'https://zynqtoon.vercel.app/';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({ status: 'ok', service: 'ZynqToon Edge CDN' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (url.pathname !== '/proxy') {
      return new Response('Not Found', { status: 404 });
    }

    const target = url.searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SSRF / Host validation
    if (!isHostAllowed(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check Cloudflare Edge Cache
    const cache = caches.default;
    const cacheKey = new Request(targetUrl.toString(), request);
    let response = await cache.match(cacheKey);

    if (response) {
      const cachedHeaders = new Headers(response.headers);
      cachedHeaders.set('X-Edge-Cache', 'HIT');
      cachedHeaders.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, {
        status: response.status,
        headers: cachedHeaders,
      });
    }

    // Upstream fetch with anti-hotlink bypass headers
    const upstreamHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Referer': getRefererForHost(targetUrl.hostname),
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    });

    try {
      const upstreamRes = await fetch(targetUrl.toString(), {
        headers: upstreamHeaders,
        cf: {
          cacheEverything: true,
          cacheTtl: 2592000, // 30 days in seconds
        },
      });

      if (!upstreamRes.ok) {
        return new Response(`Upstream error: ${upstreamRes.statusText}`, {
          status: upstreamRes.status,
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }

      const responseHeaders = new Headers(upstreamRes.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      responseHeaders.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000, immutable');
      responseHeaders.set('X-Edge-Cache', 'MISS');

      response = new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });

      // Save to Cloudflare Edge Cache asynchronously
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
