import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZqynToon — Baca Komik Manga & Manhwa",
    short_name: "ZqynToon",
    description: "Platform baca komik Manga, Manhwa, dan Manhua Bahasa Indonesia terlengkap dengan reader internal tanpa iklan.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07080B",
    theme_color: "#07080B",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
