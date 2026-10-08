"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Sembunyikan footer di mode reader (/manga/[slug]/[chapterId])
  const isReadingChapter = /^\/manga\/[^\/]+\/[^\/]+/.test(pathname);
  if (isReadingChapter) return null;

  return (
    <footer className="w-full bg-[#07080B] border-t border-white/5 py-12 mt-20 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F27D26] flex items-center justify-center font-bold text-black text-sm">
                Z
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                ZQYN<span className="text-[#F27D26]">TOON</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Platform baca komik Manga, Manhwa, dan Manhua Bahasa Indonesia tercepat dengan reader internal tanpa gangguan iklan dan tanpa pengalihan ke situs lain.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-[#F27D26] transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-[#F27D26] transition-colors">
                  Komik Populer
                </Link>
              </li>
              <li>
                <Link href="/latest" className="hover:text-[#F27D26] transition-colors">
                  Rilis Terbaru
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-[#F27D26] transition-colors">
                  Daftar Bookmark
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-[#F27D26] transition-colors">
                  Riwayat Bacaan
                </Link>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Disclaimer Legal
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              ZqynToon tidak mengunggah atau menyimpan berkas gambar komik secara langsung. Seluruh konten berasal dari agregasi scanlation publik. Untuk mendukung kreator resmi, silakan beli komik cetak atau akses platform lisensi resminya.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ZqynToon. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1.5">
            Dibuat dengan <Heart className="w-3.5 h-3.5 text-[#F27D26] fill-[#F27D26]" /> untuk Pembaca Komik Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
