import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zynqtoon.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/proxy', '/api/proxy/*', '/api/auth', '/api/auth/*'],
      },
      {
        // Generative Search & AI Crawlers (GSO / GEO)
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Google-Extended',
          'GPTBot',
          'PerplexityBot',
          'ClaudeBot',
          'Applebot',
          'Amazonbot',
        ],
        allow: '/',
        disallow: ['/api/proxy', '/api/proxy/*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
