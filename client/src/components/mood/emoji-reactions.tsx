import { motion } from 'framer-motion';
import { REACTION_EMOJIS, type ReactionEmoji } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmojiReactionsProps {
  postId: string;
  counts: Record<string, number>;
  onReaction?: (postId: string, emoji: string) => void;
  className?: string;
}

const emojiLabels: Record<ReactionEmoji, string> = {
  '🔥': 'fire',
  '😭': 'cry',
  '💀': 'skull',
  '🫶': 'heart'
};

export function EmojiReactions({ postId, counts, onReaction, className }: EmojiReactionsProps) {
  const handleReaction = (emoji: ReactionEmoji) => {
    onReaction?.(postId, emoji);
  };

  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts[emojiLabels[emoji]] || 0;
        
        return (
          <motion.div key={emoji} whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReaction(emoji)}
              className={cn(
                "h-8 px-2 flex items-center gap-1 rounded-full transition-all",
                count > 0 
                  ? "bg-primary/10 border-primary/20 hover:bg-primary/20" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <motion.span
                animate={{ scale: count > 0 ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.2 }}
              >
                {emoji}
              </motion.span>
              {count > 0 && (
                <span className="text-xs font-medium">{count}</span>
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
