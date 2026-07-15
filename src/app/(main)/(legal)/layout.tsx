export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto bg-[#121212] p-8 md:p-12 rounded-2xl border border-white/5 shadow-2xl shadow-black">
        {children}
      </div>
    </main>
  );
}
