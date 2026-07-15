/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: '%s | ZynqToon',
      default: 'ZynqToon - Baca Komik Manga Bahasa Indonesia',
    },
    description: 'Platform baca komik manga, manhwa, dan manhua bahasa Indonesia dengan update tercepat.',
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[#050505] flex flex-col font-sans text-white">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
