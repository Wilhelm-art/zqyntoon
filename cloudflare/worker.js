/**
 * Cloudflare Worker for ZqynToon
 * Handles Edge Caching, Security Headers, and DDoS Mitigation
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Bypass cache for API mutations or specific routes if needed
    const isImageProxy = url.pathname.startsWith("/api/proxy");

    let response;
    const cache = caches.default;

    if (isImageProxy) {
      // Check Cloudflare Edge cache for proxied comic images
      response = await cache.match(request);
      if (response) {
        return response;
      }
    }

    // Forward to origin
    response = await fetch(request);

    // Clone response to add security headers and cache
    const modifiedResponse = new Response(response.body, response);

    modifiedResponse.headers.set("X-Content-Type-Options", "nosniff");
    modifiedResponse.headers.set("X-Frame-Options", "DENY");
    modifiedResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    modifiedResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (isImageProxy && response.ok) {
      modifiedResponse.headers.set("Cache-Control", "public, max-age=604800, s-maxage=2592000");
      ctx.waitUntil(cache.put(request, modifiedResponse.clone()));
    }

    return modifiedResponse;
  },
};
