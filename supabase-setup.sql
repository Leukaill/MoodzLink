-- MoodzLink Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  nickname TEXT,
  profile_picture_url TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_count INTEGER DEFAULT 0,
  last_post_date TIMESTAMP WITH TIME ZONE,
  total_posts INTEGER DEFAULT 0,
  total_reactions_received INTEGER DEFAULT 0
);

-- Mood posts table
CREATE TABLE IF NOT EXISTS mood_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  mood_emoji TEXT NOT NULL,
  text TEXT,
  media_url TEXT,
  media_type TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reaction_counts JSONB DEFAULT '{}'::jsonb
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  post_id UUID REFERENCES mood_posts(id) NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, emoji)
);

-- Daily photos table
CREATE TABLE IF NOT EXISTS daily_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  photo_url TEXT NOT NULL,
  mood_emoji TEXT NOT NULL,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_posted TEXT NOT NULL,
  UNIQUE(user_id, date_posted)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID REFERENCES users(id) NOT NULL,
  swiped_id UUID REFERENCES users(id) NOT NULL,
  post_id UUID REFERENCES mood_posts(id),
  direction TEXT NOT NULL,
  mood_emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id, post_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID REFERENCES users(id) NOT NULL,
  user_id_2 UUID REFERENCES users(id) NOT NULL,
  mood_emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id_1, user_id_2)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  sender_id UUID REFERENCES users(id) NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  mood_emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- Message reports table
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) NOT NULL,
  message_id UUID REFERENCES chat_messages(id) NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for mood_posts table
CREATE POLICY "Anyone can view mood posts" ON mood_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON mood_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON mood_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reactions table
CREATE POLICY "Anyone can view reactions" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily_photos table
CREATE POLICY "Users can view their own daily photos" ON daily_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily photos" ON daily_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements table
CREATE POLICY "Users can view their own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements" ON achievements
  FOR INSERT WITH CHECK (true);

-- RLS Policies for swipes table
CREATE POLICY "Users can view their own swipes" ON swipes
  FOR SELECT USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create their own swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- RLS Policies for matches table
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view messages in their matches" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = chat_messages.match_id 
      AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = chat_messages.match_id 
      AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
    )
  );

-- RLS Policies for message_reports table
CREATE POLICY "Users can create message reports" ON message_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_posts_created_at ON mood_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_posts_user_id ON mood_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_posts_mood_emoji ON mood_posts(mood_emoji);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_id ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped_id ON swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_ids ON matches(user_id_1, user_id_2);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id ON chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_photos_date ON daily_photos(date_posted);

-- Function to automatically create user record when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, is_anonymous)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nickname', 'Anonymous'),
    COALESCE((new.raw_user_meta_data->>'isAnonymous')::boolean, true)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to clean up expired messages
CREATE OR REPLACE FUNCTION public.cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_messages WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;