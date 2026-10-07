import { NextRequest, NextResponse } from "next/server";

// SSRF Protection: Deny private / internal network IPs and hostnames
function isPrivateAddress(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 private ranges check
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
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

    if (isPrivateAddress(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Access to private or restricted network address is denied." }, { status: 403 });
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

    const upstreamResponse = await fetch(parsedUrl.toString(), { headers });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: `Upstream returned status ${upstreamResponse.status} ${upstreamResponse.statusText}` },
        { status: upstreamResponse.status }
      );
    }

    const contentType = upstreamResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await upstreamResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Proxied-By": "ZqynToon-Edge-Proxy",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to proxy image", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
