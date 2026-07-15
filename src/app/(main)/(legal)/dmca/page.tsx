"use client";
import { useLanguageStore } from "@/store/languageStore";

export default function DMCA() {
  const { lang } = useLanguageStore();

  return (
    <>
      <h1 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight text-white mb-8">
        DMCA Takedown Notice
      </h1>
      <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
        <p>
          {lang === 'id' 
            ? 'ZynqToon sangat menghormati hak kekayaan intelektual (HAKI). Semua data manga, gambar, dan terjemahan yang ditampilkan di situs ini ditarik secara dinamis dari API publik pihak ketiga (MangaDex). ZynqToon TIDAK meng-host, menyimpan, atau mendistribusikan file manga di server internal kami.' 
            : 'ZynqToon strongly respects intellectual property rights. All manga data, images, and translations displayed on this site are pulled dynamically from a third-party public API (MangaDex). ZynqToon DOES NOT host, store, or distribute manga files on our internal servers.'}
        </p>

        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">
          {lang === 'id' ? 'Prosedur Takedown' : 'Takedown Procedure'}
        </h2>
        <p>
          {lang === 'id' 
            ? 'Jika Anda adalah pemegang hak cipta dan menemukan konten yang melanggar hak Anda, silakan ikuti langkah berikut:'
            : 'If you are a copyright holder and find content that violates your rights, please follow these steps:'}
        </p>
        
        <ol className="list-decimal pl-6 space-y-2">
          <li>{lang === 'id' ? 'Sertakan nama lengkap dan informasi kontak Anda (Email/Telepon).' : 'Provide your full name and contact information (Email/Phone).'}</li>
          <li>{lang === 'id' ? 'Berikan deskripsi spesifik tentang karya berhak cipta yang diklaim dilanggar, beserta URL (tautan) ZynqToon.' : 'Provide a specific description of the copyrighted work claimed to be infringed, along with the ZynqToon URL(s).'}</li>
          <li>{lang === 'id' ? 'Sertakan pernyataan iktikad baik bahwa penggunaan materi tersebut tidak diizinkan oleh pemilik hak cipta.' : 'Include a good faith statement that use of the material is not authorized by the copyright owner.'}</li>
          <li>{lang === 'id' ? 'Karena kami menarik data dari MangaDex, kami sangat menyarankan Anda juga mengirimkan DMCA langsung ke penyedia API sumber untuk menghapus file root.' : 'Since we pull data from MangaDex, we highly recommend you also send a DMCA directly to the source API provider to remove the root files.'}</li>
        </ol>

        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="font-medium text-white mb-2">{lang === 'id' ? 'Kirim laporan ke:' : 'Send reports to:'}</p>
          <p className="text-[#F27D26]">dmca@zynqtoon.vercel.app</p>
        </div>
      </div>
    </>
  );
}
