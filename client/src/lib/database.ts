import { supabase } from './supabase';
import type { MoodPost, User, Reaction, DailyPhoto, Achievement, Swipe, Match, ChatMessage } from '@shared/schema';

// User operations
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Mood posts operations
export const getMoodPosts = async (limit: number = 20, offset: number = 0) => {
  const { data, error } = await supabase
    .from('mood_posts')
    .select(`
      *,
      users!inner(id, nickname, profile_picture_url, is_anonymous)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data;
};

export const createMoodPost = async (post: Omit<MoodPost, 'id' | 'created_at' | 'reaction_counts'>) => {
  const { data, error } = await supabase
    .from('mood_posts')
    .insert(post)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Reactions operations
export const addReaction = async (postId: string, userId: string, emoji: string) => {
  // First check if reaction already exists
  const { data: existingReaction } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .single();

  if (existingReaction) {
    // Remove existing reaction
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existingReaction.id);
    
    if (error) throw error;
    return null;
  } else {
    // Add new reaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        post_id: postId,
        user_id: userId,
        emoji
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const getPostReactions = async (postId: string) => {
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji, user_id')
    .eq('post_id', postId);
  
  if (error) throw error;
  return data;
};

// Daily photos operations
export const getDailyPhoto = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('daily_photos')
    .select('*')
    .eq('user_id', userId)
    .eq('date_posted', date)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
};

export const createDailyPhoto = async (photo: Omit<DailyPhoto, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('daily_photos')
    .insert(photo)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Matching operations
export const getPotentialMatches = async (userId: string, moodEmoji: string, limit: number = 20) => {
  // Get users with similar mood posts who haven't been swiped on yet
  const { data, error } = await supabase
    .from('mood_posts')
    .select(`
      user_id,
      users!inner(id, nickname, profile_picture_url, is_anonymous),
      mood_emoji,
      text,
      media_url,
      media_type,
      created_at
    `)
    .eq('mood_emoji', moodEmoji)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  // Filter out users we've already swiped on
  const { data: swipedUsers } = await supabase
    .from('swipes')
    .select('swiped_id')
    .eq('swiper_id', userId);
  
  const swipedUserIds = swipedUsers?.map(s => s.swiped_id) || [];
  
  return data?.filter(post => !swipedUserIds.includes(post.user_id)) || [];
};

export const createSwipe = async (swipe: Omit<Swipe, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('swipes')
    .insert(swipe)
    .select()
    .single();
  
  if (error) throw error;
  
  // Check if this creates a match (both users swiped right on each other)
  if (swipe.direction === 'right') {
    const { data: reciprocalSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_id', swipe.swiped_id)
      .eq('swiped_id', swipe.swiper_id)
      .eq('direction', 'right')
      .single();
    
    if (reciprocalSwipe) {
      // Create a match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          user_id_1: Math.min(swipe.swiper_id, swipe.swiped_id), // Ensure consistent ordering
          user_id_2: Math.max(swipe.swiper_id, swipe.swiped_id),
          mood_emoji: swipe.mood_emoji
        })
        .select()
        .single();
      
      if (matchError) throw matchError;
      return { swipe: data, match };
    }
  }
  
  return { swipe: data, match: null };
};

// Matches operations
export const getUserMatches = async (userId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      user1:users!matches_user_id_1_fkey(id, nickname, profile_picture_url, is_anonymous),
      user2:users!matches_user_id_2_fkey(id, nickname, profile_picture_url, is_anonymous)
    `)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Chat messages operations
export const getMatchMessages = async (matchId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:users!chat_messages_sender_id_fkey(id, nickname, profile_picture_url, is_anonymous)
    `)
    .eq('match_id', matchId)
    .gt('expires_at', new Date().toISOString()) // Only get non-expired messages
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'created_at' | 'expires_at' | 'is_read'>) => {
  // Set expiration to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      ...message,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update last message timestamp on the match
  await supabase
    .from('matches')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', message.match_id);
  
  return data;
};

// Real-time subscriptions
export const subscribeToMoodPosts = (callback: (post: any) => void) => {
  return supabase
    .channel('mood_posts_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'mood_posts'
    }, callback)
    .subscribe();
};

export const subscribeToReactions = (postId: string, callback: (reaction: any) => void) => {
  return supabase
    .channel(`reactions_${postId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reactions',
      filter: `post_id=eq.${postId}`
    }, callback)
    .subscribe();
};

export const subscribeToMessages = (matchId: string, callback: (message: any) => void) => {
  return supabase
    .channel(`messages_${matchId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `match_id=eq.${matchId}`
    }, callback)
    .subscribe();
};