-- Create bookmarks table
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id TEXT NOT NULL,
    manga_title TEXT NOT NULL,
    manga_slug TEXT,
    cover_url TEXT,
    source TEXT NOT NULL,
    author TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, manga_id)
);

-- Create history table
CREATE TABLE reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id TEXT NOT NULL,
    manga_title TEXT NOT NULL,
    manga_slug TEXT,
    chapter_id TEXT NOT NULL,
    chapter_number TEXT NOT NULL,
    source TEXT NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, manga_id)
);

-- RLS Policies
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own bookmarks" ON bookmarks
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- History policies
CREATE POLICY "Users can view their own history" ON reading_history
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own history" ON reading_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own history" ON reading_history
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own history" ON reading_history
    FOR DELETE USING (auth.uid() = user_id);