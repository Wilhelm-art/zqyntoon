"use client";
import { useLanguageStore } from "@/store/languageStore";

export default function Privacy() {
  const { lang } = useLanguageStore();

  return (
    <>
      <h1 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight text-white mb-8">
        {lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
      </h1>
      <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">1. {lang === 'id' ? 'Pengumpulan Data' : 'Data Collection'}</h2>
        <p>{lang === 'id' 
          ? 'ZynqToon dirancang untuk menghormati privasi Anda. Kami tidak mewajibkan pembuatan akun untuk menggunakan layanan dasar kami. Kami hanya menyimpan preferensi antarmuka Anda (seperti pilihan bahasa ID/EN) secara lokal di browser Anda melalui LocalStorage.' 
          : 'ZynqToon is designed to respect your privacy. We do not require account creation for basic service usage. We only store your interface preferences (like the ID/EN language toggle) locally in your browser via LocalStorage.'}</p>
          
        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">2. {lang === 'id' ? 'Layanan Pihak Ketiga' : 'Third-Party Services'}</h2>
        <p>{lang === 'id' 
          ? 'Karena kami menggunakan MangaDex API untuk menyajikan konten, alamat IP dan permintaan agen-pengguna Anda mungkin dikirim ke server mereka saat mengambil gambar dan informasi chapter.' 
          : 'Because we utilize the MangaDex API to serve content, your IP address and user-agent requests may be sent to their servers when fetching images and chapter information.'}</p>

        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">3. {lang === 'id' ? 'Tidak Ada Penjualan Data' : 'No Data Sold'}</h2>
        <p>{lang === 'id' 
          ? 'ZynqToon tidak menjual, menyewakan, atau memperdagangkan data pribadi pengguna kepada pihak ketiga mana pun.' 
          : 'ZynqToon does not sell, rent, or trade any personal user data to any third parties.'}</p>
      </div>
    </>
  );
}
