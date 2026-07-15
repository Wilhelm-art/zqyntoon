import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@consumet/extensions', 'got-scraping', 'got', 'cheerio'],
};

export default nextConfig;
