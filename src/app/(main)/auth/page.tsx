"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/store/languageStore";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { lang } = useLanguageStore();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router, supabase.auth]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="bg-[#111115] border border-white/10 p-8 sm:p-10 rounded-2xl max-w-md w-full text-center shadow-2xl relative">
        <Link 
          href="/" 
          className="absolute top-6 left-6 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          title={lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="w-14 h-14 rounded-2xl bg-[#181820] border border-white/10 flex items-center justify-center text-[#F27D26] mx-auto mb-5 shadow-inner">
          <Shield className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {lang === 'id' ? 'Masuk ke ZynqToon' : 'Sign in to ZynqToon'}
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mb-8 leading-relaxed max-w-xs mx-auto">
          {lang === 'id' 
            ? 'Sinkronkan riwayat baca dan bookmark secara real-time di seluruh perangkat.' 
            : 'Synchronize your reading history and bookmarks across all your devices.'}
        </p>

        <div className="flex flex-col gap-3.5">
          <button 
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 bg-white text-black py-3 px-4 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all shadow-md active:scale-[0.98] w-full"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{lang === 'id' ? 'Lanjutkan dengan Google' : 'Continue with Google'}</span>
          </button>
          
          <button 
            onClick={handleDiscordLogin}
            className="flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] w-full"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.09-.09C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            <span>{lang === 'id' ? 'Lanjutkan dengan Discord' : 'Continue with Discord'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}