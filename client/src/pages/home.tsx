import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, RefreshCw } from 'lucide-react';
import { MoodPost, MOOD_EMOJIS } from '@shared/schema';
import { BottomNav } from '@/components/layout/bottom-nav';
import { FloatingActionButton } from '@/components/layout/floating-action-button';
import { MoodPostCard } from '@/components/mood/mood-post-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealTimePosts } from '@/hooks/use-real-time';
import { useAuthContext } from '@/contexts/auth-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Set up real-time subscriptions
  useRealTimePosts();

  // Check if user is authenticated on mount
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  const { data: posts = [], isLoading, refetch } = useQuery<MoodPost[]>({
    queryKey: ['/api/mood-posts', filterMood],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('mood_posts')
        .select(`
          *,
          users!inner(nickname, is_anonymous)
        `)
        .order('created_at', { ascending: false });
      
      if (filterMood !== 'all') {
        query = query.eq('mood_emoji', filterMood);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Ensure posts is always an array
  const safePosts = Array.isArray(posts) ? posts : [];

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      if (!user) throw new Error('Must be logged in to react');
      
      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('emoji', emoji)
        .single();
      
      if (existingReaction) {
        // Remove existing reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add new reaction
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            emoji: emoji,
          })
          .select()
          .single();
        if (error) throw error;
        return { action: 'added', data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to react",
        description: error.message
      });
    }
  });

  const handleReaction = (postId: string, emoji: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    reactionMutation.mutate({ postId, emoji });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MoodLink</h1>
            <p className="text-gray-600 dark:text-gray-400">Share your mood, connect with others</p>
            <Button onClick={() => setShowAuthModal(true)}>Get Started</Button>
          </div>
        </div>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">MoodzLink</h1>
          <div className="flex items-center gap-2">
            <Select value={filterMood} onValueChange={setFilterMood}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moods</SelectItem>
                {MOOD_EMOJIS.map((emoji) => (
                  <SelectItem key={emoji} value={emoji}>
                    {emoji}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : safePosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">😶‍🌫️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No mood posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to share your mood with the community!
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {safePosts.map((post) => (
              <MoodPostCard
                key={post.id}
                post={post}
                onReaction={handleReaction}
              />
            ))}
          </AnimatePresence>
        )}
      </main>

      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
