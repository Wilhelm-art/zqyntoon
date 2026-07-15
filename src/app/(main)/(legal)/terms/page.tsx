"use client";
import { useLanguageStore } from "@/store/languageStore";

export default function Terms() {
  const { lang } = useLanguageStore();

  return (
    <>
      <h1 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight text-white mb-8">
        {lang === 'id' ? 'Syarat Ketentuan' : 'Terms of Service'}
      </h1>
      <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
        <p className="text-white/40 text-sm">{lang === 'id' ? 'Terakhir Diperbarui: 15 Juli 2026' : 'Last Updated: July 15, 2026'}</p>
        
        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">1. {lang === 'id' ? 'Penerimaan Syarat' : 'Acceptance of Terms'}</h2>
        <p>{lang === 'id' 
          ? 'Dengan mengakses ZynqToon, Anda menyetujui Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun, harap hentikan penggunaan platform.' 
          : 'By accessing ZynqToon, you agree to these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the platform.'}</p>
          
        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">2. {lang === 'id' ? 'Konten Pihak Ketiga' : 'Third-Party Content'}</h2>
        <p>{lang === 'id' 
          ? 'ZynqToon bertindak semata-mata sebagai antarmuka (interface). Semua manga, gambar, dan terjemahan disediakan oleh MangaDex API. Kami tidak menyimpan, mengunggah, atau mendistribusikan materi berhak cipta apa pun di server kami sendiri.' 
          : 'ZynqToon acts solely as an interface. All manga, images, and translations are provided by the MangaDex API. We do not store, upload, or distribute any copyrighted material on our own servers.'}</p>

        <h2 className="text-2xl font-medium text-white/90 mt-8 mb-4">3. {lang === 'id' ? 'Batasan Tanggung Jawab' : 'Limitation of Liability'}</h2>
        <p>{lang === 'id' 
          ? 'ZynqToon disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas kerugian, interupsi, atau ketidakakuratan data dari penyedia API pihak ketiga.' 
          : 'ZynqToon is provided "as is". We are not liable for any damages, interruptions, or data inaccuracies stemming from third-party API providers.'}</p>
      </div>
    </>
  );
}
