import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zynqtoon.web.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/bookmarks", "/history"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
