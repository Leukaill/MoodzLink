import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MoodPost } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MediaPreview } from './media-preview';
import { EmojiReactions } from './emoji-reactions';
import { useRealTimeReactions } from '@/hooks/use-real-time';
import { useAuth } from '@/hooks/use-auth';
import { Heart } from 'lucide-react';
import { useLocation } from 'wouter';

interface MoodPostCardProps {
  post: MoodPost;
  onReaction?: (postId: string, emoji: string) => void;
  showMatchButton?: boolean;
}

export function MoodPostCard({ post, onReaction, showMatchButton = true }: MoodPostCardProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  useRealTimeReactions(post.id);

  const handleMatchClick = () => {
    if (!user) return;
    setLocation(`/discover-matches?mood=${post.moodEmoji}&fromPost=${post.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-lg">
                {post.moodEmoji}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {post.isAnonymous ? 'Anonymous' : 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true })}
              </p>
            </div>
            <div className="text-2xl">{post.moodEmoji}</div>
          </div>

          {/* Content */}
          {post.text && (
            <p className="text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">
              {post.text}
            </p>
          )}

          {/* Media */}
          {post.mediaUrl && (
            <MediaPreview
              url={post.mediaUrl}
              type={post.mediaType as 'image' | 'video' | 'audio'}
              className="mb-3"
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <EmojiReactions
              postId={post.id}
              counts={post.reactionCounts as Record<string, number> || {}}
              onReaction={onReaction}
              className="flex-1"
            />
            
            {showMatchButton && user && post.userId !== user.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMatchClick}
                className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
              >
                <Heart className="h-4 w-4 mr-1" />
                Match
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
