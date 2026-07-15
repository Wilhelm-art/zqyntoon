import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: {
      template: '%s | ZynqToon',
      default: lang === 'en' ? 'ZynqToon - Read Manga Online' : 'ZynqToon - Baca Komik Manga Bahasa Indonesia',
    },
    description: lang === 'en' 
      ? 'Read manga, manhwa, and manhua online with the fastest updates.'
      : 'Platform baca komik manga, manhwa, dan manhua bahasa Indonesia dengan update tercepat.',
    alternates: {
      languages: {
        'id': '/id',
        'en': '/en',
        'x-default': '/id',
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[#050505] flex flex-col font-sans text-white">
        <Navbar lang={lang} />
        {children}
        <Footer lang={lang} />
      </body>
    </html>
  );
}
