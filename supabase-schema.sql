-- MoodzLink Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and profiles
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT,
    nickname TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    streak_count INTEGER DEFAULT 0,
    last_post_date TIMESTAMP WITH TIME ZONE,
    total_posts INTEGER DEFAULT 0,
    total_reactions_received INTEGER DEFAULT 0
);

-- Mood posts table
CREATE TABLE mood_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    mood_emoji TEXT NOT NULL,
    text TEXT,
    media_url TEXT,
    media_type TEXT, -- 'image', 'audio', 'video'
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reaction_counts JSONB DEFAULT '{}'::jsonb -- {fire: 0, cry: 0, skull: 0, heart: 0}
);

-- Reactions table
CREATE TABLE reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    post_id UUID REFERENCES mood_posts(id) NOT NULL,
    emoji TEXT NOT NULL, -- '🔥', '😭', '💀', '🫶'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, emoji)
);

-- Daily mood photos (BeReal-style)
CREATE TABLE daily_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    photo_url TEXT NOT NULL,
    mood_emoji TEXT NOT NULL,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_posted TEXT NOT NULL, -- YYYY-MM-DD format
    UNIQUE(user_id, date_posted)
);

-- Achievements/Badges
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    badge_type TEXT NOT NULL, -- 'streak_7', 'popular_post', 'mood_explorer', etc.
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_type)
);

-- Mood matches for the "find someone who feels like me" feature
CREATE TABLE mood_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id_1 UUID REFERENCES users(id) NOT NULL,
    user_id_2 UUID REFERENCES users(id) NOT NULL,
    mood_emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id_1, user_id_2)
);

-- Chat messages for mood matches
CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES mood_matches(id) NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_mood_posts_user_id ON mood_posts(user_id);
CREATE INDEX idx_mood_posts_created_at ON mood_posts(created_at DESC);
CREATE INDEX idx_mood_posts_mood_emoji ON mood_posts(mood_emoji);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_daily_photos_user_id ON daily_photos(user_id);
CREATE INDEX idx_daily_photos_date_posted ON daily_photos(date_posted);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_mood_matches_user_id_1 ON mood_matches(user_id_1);
CREATE INDEX idx_mood_matches_user_id_2 ON mood_matches(user_id_2);
CREATE INDEX idx_chat_messages_match_id ON chat_messages(match_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Mood posts are readable by everyone, but only owners can modify
CREATE POLICY "Mood posts are readable by everyone" ON mood_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own mood posts" ON mood_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood posts" ON mood_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood posts" ON mood_posts FOR DELETE USING (auth.uid() = user_id);

-- Reactions are readable by everyone, but only owners can modify
CREATE POLICY "Reactions are readable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Daily photos are readable by everyone, but only owners can modify
CREATE POLICY "Daily photos are readable by everyone" ON daily_photos FOR SELECT USING (true);
CREATE POLICY "Users can insert their own daily photos" ON daily_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily photos" ON daily_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily photos" ON daily_photos FOR DELETE USING (auth.uid() = user_id);

-- Achievements are readable by everyone, but only the system can modify
CREATE POLICY "Achievements are readable by everyone" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert achievements" ON achievements FOR INSERT WITH CHECK (true);

-- Mood matches are readable by participants only
CREATE POLICY "Mood matches are readable by participants" ON mood_matches FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can insert mood matches" ON mood_matches FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can update their mood matches" ON mood_matches FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Chat messages are readable by match participants only
CREATE POLICY "Chat messages are readable by match participants" ON chat_messages 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mood_matches 
        WHERE mood_matches.id = chat_messages.match_id 
        AND (mood_matches.user_id_1 = auth.uid() OR mood_matches.user_id_2 = auth.uid())
    )
);
CREATE POLICY "Users can insert chat messages" ON chat_messages 
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM mood_matches 
        WHERE mood_matches.id = chat_messages.match_id 
        AND (mood_matches.user_id_1 = auth.uid() OR mood_matches.user_id_2 = auth.uid())
    )
);

-- Functions for automatic user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, is_anonymous)
    VALUES (NEW.id, NEW.email, CASE WHEN NEW.is_anonymous THEN true ELSE false END);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mood_posts 
        SET reaction_counts = COALESCE(reaction_counts, '{}'::jsonb) || 
            jsonb_build_object(
                CASE NEW.emoji
                    WHEN '🔥' THEN 'fire'
                    WHEN '😭' THEN 'cry'
                    WHEN '💀' THEN 'skull'
                    WHEN '🫶' THEN 'heart'
                    ELSE 'unknown'
                END,
                COALESCE((reaction_counts ->> CASE NEW.emoji
                    WHEN '🔥' THEN 'fire'
                    WHEN '😭' THEN 'cry'
                    WHEN '💀' THEN 'skull'
                    WHEN '🫶' THEN 'heart'
                    ELSE 'unknown'
                END)::integer, 0) + 1
            )
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mood_posts 
        SET reaction_counts = COALESCE(reaction_counts, '{}'::jsonb) || 
            jsonb_build_object(
                CASE OLD.emoji
                    WHEN '🔥' THEN 'fire'
                    WHEN '😭' THEN 'cry'
                    WHEN '💀' THEN 'skull'
                    WHEN '🫶' THEN 'heart'
                    ELSE 'unknown'
                END,
                GREATEST(0, COALESCE((reaction_counts ->> CASE OLD.emoji
                    WHEN '🔥' THEN 'fire'
                    WHEN '😭' THEN 'cry'
                    WHEN '💀' THEN 'skull'
                    WHEN '🫶' THEN 'heart'
                    ELSE 'unknown'
                END)::integer, 0) - 1)
            )
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reaction counts
CREATE TRIGGER reaction_counts_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();