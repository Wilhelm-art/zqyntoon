import { NextRequest, NextResponse } from "next/server";

// SSRF & Open Proxy Protection: Strictly allowed upstream domains
const ALLOWED_IMAGE_DOMAINS = [
  "komiku.org",
  "komiku.to",
  "komiku.id",
  "komiku.vip",
  "komiku.asia",
  "cdn.komiku.to",
  "img.komiku.id",
  "bacakomik.my",
  "mangadex.org",
  "mangadex.network",
  "wp.com",
  "blogspot.com",
  "googleusercontent.com",
  "cloudinary.com",
  "komikcdn.com",
  "cdnkomiku.com",
];

function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_IMAGE_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith("." + domain)
  );
}

// SSRF Protection: Deny private / internal network IPs and hostnames
function isPrivateAddress(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".localhost")
  ) {
    return true;
  }

  // IPv4 private ranges check
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const octet1 = parseInt(match[1], 10);
    const octet2 = parseInt(match[2], 10);

    // 10.0.0.0 - 10.255.255.255
    if (octet1 === 10) return true;
    // 127.0.0.0 - 127.255.255.255
    if (octet1 === 127) return true;
    // 169.254.0.0 - 169.254.255.255 (Link-local & AWS/Cloud Metadata)
    if (octet1 === 169 && octet2 === 254) return true;
    // 172.16.0.0 - 172.31.255.255
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (octet1 === 192 && octet2 === 168) return true;
    // 0.0.0.0
    if (octet1 === 0) return true;
  }

  // Deny raw numeric IP or hex notations like 2130706433 or 0x7f000001
  if (/^\d+$/.test(lower) || /^0x[0-9a-f]+$/i.test(lower)) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(targetUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid protocol. Only http and https supported." }, { status: 400 });
    }

    if (isPrivateAddress(parsedUrl.hostname) || !isAllowedHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Access to the requested host is denied." }, { status: 403 });
    }

    // Adaptive headers based on upstream host
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    };

    if (parsedUrl.hostname.includes("mangadex")) {
      headers["Referer"] = "https://mangadex.org/";
    } else if (parsedUrl.hostname.includes("komiku")) {
      headers["Referer"] = "https://komiku.org/";
    } else {
      headers["Referer"] = "https://bacakomik.my/";
    }

    // Fetch upstream with manual redirect and timeout to prevent hanging sockets
    let upstreamResponse: Response | null = null;
    const fetchOptions: RequestInit = {
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
    };

    // Retry loop (up to 2 attempts for transient upstream network hiccups)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let res = await fetch(parsedUrl.toString(), fetchOptions);

        // Handle single safe redirect hop if upstream redirects within allowed domain
        if ([301, 302, 307, 308].includes(res.status)) {
          const redirectLocation = res.headers.get("location");
          if (!redirectLocation) {
            return NextResponse.json({ error: "Upstream redirect location missing." }, { status: 502 });
          }
          const redirectUrl = new URL(redirectLocation, parsedUrl.origin);
          if (
            (redirectUrl.protocol !== "http:" && redirectUrl.protocol !== "https:") ||
            isPrivateAddress(redirectUrl.hostname) ||
            !isAllowedHost(redirectUrl.hostname)
          ) {
            return NextResponse.json({ error: "Redirect to untrusted address is denied." }, { status: 403 });
          }
          res = await fetch(redirectUrl.toString(), fetchOptions);
        }

        if (res.ok) {
          upstreamResponse = res;
          break;
        }

        if (attempt === 0 && (res.status >= 500 || res.status === 429)) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        upstreamResponse = res;
        break;
      } catch (err: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        throw err;
      }
    }

    if (!upstreamResponse || !upstreamResponse.ok) {
      const status = upstreamResponse?.status || 502;
      return NextResponse.json(
        { error: `Upstream returned status ${status}` },
        { status }
      );
    }

    // Verify Content-Type is an image
    const rawContentType = upstreamResponse.headers.get("content-type") || "";
    const isImage =
      rawContentType.toLowerCase().startsWith("image/") ||
      rawContentType.toLowerCase().includes("application/octet-stream");

    if (!isImage) {
      return NextResponse.json(
        { error: "Invalid upstream content type. Only images are allowed." },
        { status: 415 }
      );
    }

    // Limit maximum image size to 15MB
    const contentLength = upstreamResponse.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Image exceeds 15MB limit." }, { status: 413 });
    }

    if (!upstreamResponse.body) {
      return NextResponse.json({ error: "Empty upstream image body" }, { status: 502 });
    }

    const contentType = rawContentType.startsWith("image/") ? rawContentType : "image/jpeg";
    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "CDN-Cache-Control": "public, max-age=31536000",
      "Vercel-CDN-Cache-Control": "public, max-age=31536000",
      "X-Proxied-By": "ZqynToon-Edge-Proxy",
    });

    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    // Stream directly to client browser without buffering full image in memory
    return new NextResponse(upstreamResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Proxy error:", err?.message);
    return NextResponse.json(
      {
        error: "Failed to proxy image",
        details: process.env.NODE_ENV === "development" ? err?.message : undefined,
      },
      { status: 500 }
    );
  }
}
