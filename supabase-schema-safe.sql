-- MoodzLink Database Schema - Safe version that handles existing tables
-- Run this in your Supabase SQL editor

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist (or modify existing one)
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS users (
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
EXCEPTION
    WHEN duplicate_table THEN
        -- Table exists, add missing columns if needed
        ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT true;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_post_date TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reactions_received INTEGER DEFAULT 0;
END $$;

-- Create mood_posts table
CREATE TABLE IF NOT EXISTS mood_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    mood_emoji TEXT NOT NULL,
    text TEXT,
    media_url TEXT,
    media_type TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reaction_counts JSONB DEFAULT '{}'::jsonb
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    post_id UUID REFERENCES mood_posts(id) NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE reactions ADD CONSTRAINT reactions_user_post_emoji_unique UNIQUE(user_id, post_id, emoji);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create daily_photos table
CREATE TABLE IF NOT EXISTS daily_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    photo_url TEXT NOT NULL,
    mood_emoji TEXT NOT NULL,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_posted TEXT NOT NULL
);

-- Create unique constraint for daily photos
DO $$ BEGIN
    ALTER TABLE daily_photos ADD CONSTRAINT daily_photos_user_date_unique UNIQUE(user_id, date_posted);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint for achievements
DO $$ BEGIN
    ALTER TABLE achievements ADD CONSTRAINT achievements_user_badge_unique UNIQUE(user_id, badge_type);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create mood_matches table
CREATE TABLE IF NOT EXISTS mood_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id_1 UUID REFERENCES users(id) NOT NULL,
    user_id_2 UUID REFERENCES users(id) NOT NULL,
    mood_emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create unique constraint for mood matches
DO $$ BEGIN
    ALTER TABLE mood_matches ADD CONSTRAINT mood_matches_users_unique UNIQUE(user_id_1, user_id_2);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES mood_matches(id) NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_mood_posts_user_id ON mood_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_posts_created_at ON mood_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_posts_mood_emoji ON mood_posts(mood_emoji);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_photos_user_id ON daily_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_photos_date_posted ON daily_photos(date_posted);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_matches_user_id_1 ON mood_matches(user_id_1);
CREATE INDEX IF NOT EXISTS idx_mood_matches_user_id_2 ON mood_matches(user_id_2);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id ON chat_messages(match_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Mood posts policies
DROP POLICY IF EXISTS "Mood posts are readable by everyone" ON mood_posts;
DROP POLICY IF EXISTS "Users can insert their own mood posts" ON mood_posts;
DROP POLICY IF EXISTS "Users can update their own mood posts" ON mood_posts;
DROP POLICY IF EXISTS "Users can delete their own mood posts" ON mood_posts;

CREATE POLICY "Mood posts are readable by everyone" ON mood_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own mood posts" ON mood_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood posts" ON mood_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood posts" ON mood_posts FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
DROP POLICY IF EXISTS "Reactions are readable by everyone" ON reactions;
DROP POLICY IF EXISTS "Users can insert their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;

CREATE POLICY "Reactions are readable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, is_anonymous)
    VALUES (NEW.id, NEW.email, CASE WHEN NEW.is_anonymous THEN true ELSE false END)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS reaction_counts_trigger ON reactions;

-- Create trigger to update reaction counts
CREATE TRIGGER reaction_counts_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();