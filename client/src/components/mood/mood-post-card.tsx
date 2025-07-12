import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MoodPost } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MediaPreview } from './media-preview';
import { EmojiReactions } from './emoji-reactions';
import { useRealTimeReactions } from '@/hooks/use-real-time';

interface MoodPostCardProps {
  post: MoodPost;
  onReaction?: (postId: string, emoji: string) => void;
}

export function MoodPostCard({ post, onReaction }: MoodPostCardProps) {
  useRealTimeReactions(post.id);

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

          {/* Reactions */}
          <EmojiReactions
            postId={post.id}
            counts={post.reactionCounts as Record<string, number> || {}}
            onReaction={onReaction}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
