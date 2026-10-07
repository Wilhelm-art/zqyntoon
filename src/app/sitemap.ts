import type { MetadataRoute } from 'next';
import { getMangaList } from '@/lib/api/mangadex';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zynqtoon.vercel.app';
  const now = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/trending`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/genre`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/bookmarks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/dmca`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamic top manga series
  let mangaRoutes: MetadataRoute.Sitemap = [];
  try {
    const mangaList = await getMangaList({ limit: 30 });
    mangaRoutes = mangaList.map((m: any) => ({
      url: `${siteUrl}/manga/${m.id}`,
      lastModified: m.attributes?.updatedAt ? new Date(m.attributes.updatedAt) : now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch (err) {
    // Fallback popular manga IDs if ISP blocks direct MangaDex fetch during local build
    const fallbackIds = [
      '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0', // Solo Leveling
      'a1c7c817-4e59-43b7-9365-09675a149a6f', // One Piece
      'c52b2ce3-7f95-469c-96b0-47452d8215fb', // Jujutsu Kaisen
      'a77742c1-30d4-4224-b1c9-73fb78b4001c', // Chainsaw Man
      '077a3fed-1634-424f-be7a-9a96b7f07b78', // Omniscient Reader
      'b0b721ff-c388-4486-aa31-0d2010042d6d', // Return of Mount Hua Sect
    ];
    mangaRoutes = fallbackIds.map((id) => ({
      url: `${siteUrl}/manga/${id}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...mangaRoutes];
}
