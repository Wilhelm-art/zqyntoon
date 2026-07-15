"use client";
import { useLanguageStore } from "@/store/languageStore";

export default function About() {
  const { lang } = useLanguageStore();
  
  return (
    <>
      <h1 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight text-white mb-8">
        {lang === 'id' ? 'Tentang ZynqToon' : 'About ZynqToon'}
      </h1>
      <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
        <p>
          {lang === 'id' 
            ? 'ZynqToon adalah platform membaca manga modern yang dirancang untuk memberikan pengalaman membaca terbaik secara gratis. Kami tidak meng-host file gambar di server kami; sebaliknya, kami memanfaatkan API pihak ketiga untuk menyajikan konten langsung ke perangkat Anda dengan kualitas tinggi dan performa optimal.'
            : 'ZynqToon is a modern manga reading platform designed to provide the best free reading experience. We do not host image files on our servers; instead, we leverage third-party APIs to deliver high-quality, high-performance content directly to your device.'}
        </p>
        <p>
          {lang === 'id'
            ? 'Antarmuka kami difokuskan pada kecepatan, desain yang responsif, dan dukungan multi-bahasa. Misi kami adalah mempermudah penggemar manga di seluruh dunia (terutama di Indonesia dan wilayah berbahasa Inggris) untuk menemukan dan menikmati seri favorit mereka tanpa gangguan.'
            : 'Our interface focuses on speed, responsive design, and multi-language support. Our mission is to make it easy for manga fans globally (especially in Indonesia and English-speaking regions) to discover and enjoy their favorite series without distractions.'}
        </p>
        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">
          {lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}
        </h2>
        <p>
          {lang === 'id'
            ? 'Untuk pertanyaan bisnis atau umpan balik, silakan hubungi kami di: contact@zynqtoon.vercel.app'
            : 'For business inquiries or feedback, please contact us at: contact@zynqtoon.vercel.app'}
        </p>
      </div>
    </>
  );
}
