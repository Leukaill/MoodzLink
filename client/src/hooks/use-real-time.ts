import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export function useRealTimePosts() {
  useEffect(() => {
    const channel = supabase
      .channel('mood_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_posts'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Invalidate and refetch posts
          queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

export function useRealTimeReactions(postId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`reactions_${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Reaction update:', payload);
          // Invalidate reactions for this post
          queryClient.invalidateQueries({ queryKey: ['/api/reactions', postId] });
          queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
}

export function useRealTimeChat(matchId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('New message:', payload);
          queryClient.invalidateQueries({ queryKey: ['/api/chat', matchId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return messages;
}
