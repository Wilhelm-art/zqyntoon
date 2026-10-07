import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://zynqtoon.vercel.app"),
  title: {
    default: "ZqynToon — Baca Komik Manga, Manhwa & Manhua Bahasa Indonesia",
    template: "%s | ZqynToon",
  },
  description:
    "Platform baca komik Manga, Manhwa, dan Manhua Bahasa Indonesia terlengkap, tercepat, dengan reader internal mulus tanpa iklan pop-up dan tanpa redirect eksternal.",
  keywords: [
    "baca komik",
    "komik indonesia",
    "baca manga sub indo",
    "manhwa indonesia",
    "manhua sub indo",
    "one piece indonesia",
    "solo leveling sub indo",
    "zqyntoon",
  ],
  authors: [{ name: "ZqynToon Team" }],
  creator: "ZqynToon",
  publisher: "ZqynToon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://zynqtoon.vercel.app",
    siteName: "ZqynToon",
    title: "ZqynToon — Baca Komik Manga & Manhwa Bahasa Indonesia",
    description:
      "Platform baca komik online Bahasa Indonesia dengan reader internal tercepat tanpa iklan mengganggu.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZqynToon Comic Reader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZqynToon — Baca Komik Bahasa Indonesia",
    description:
      "Baca komik manga, manhwa & manhua terlengkap Bahasa Indonesia tanpa redirect eksternal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZqynToon",
    url: "https://zynqtoon.vercel.app",
    description: "Platform baca komik manga, manhwa, dan manhua Bahasa Indonesia terlengkap.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://zynqtoon.vercel.app/?s={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="id" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans min-h-screen flex flex-col bg-[#07080B] text-gray-100`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
