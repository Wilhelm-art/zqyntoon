-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comic_slug TEXT NOT NULL,
  comic_title TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  comic_type TEXT DEFAULT 'Manga',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comic_slug)
);

-- Reading History table
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comic_slug TEXT NOT NULL,
  comic_title TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT NOT NULL,
  progress NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comic_slug)
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own history" ON public.reading_history FOR ALL USING (auth.uid() = user_id);
