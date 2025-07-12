import { motion } from 'framer-motion';
import { Trophy, Flame, Star, Heart, Sun, Moon, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type BadgeType } from '@shared/schema';

interface BadgeDisplayProps {
  badges: BadgeType[];
  className?: string;
}

const badgeConfig: Record<BadgeType, { icon: any; label: string; color: string }> = {
  streak_7: { icon: Flame, label: '7 Day Streak', color: 'bg-orange-500' },
  streak_30: { icon: Trophy, label: '30 Day Streak', color: 'bg-yellow-500' },
  popular_post: { icon: Star, label: 'Popular Post', color: 'bg-purple-500' },
  mood_explorer: { icon: Sparkles, label: 'Mood Explorer', color: 'bg-blue-500' },
  helper: { icon: Heart, label: 'Helper', color: 'bg-pink-500' },
  early_bird: { icon: Sun, label: 'Early Bird', color: 'bg-yellow-400' },
  night_owl: { icon: Moon, label: 'Night Owl', color: 'bg-indigo-500' },
};

export function BadgeDisplay({ badges, className }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No badges yet. Keep posting to earn your first badge!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
      {badges.map((badgeType, index) => {
        const config = badgeConfig[badgeType];
        const Icon = config.icon;

        return (
          <motion.div
            key={badgeType}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <Badge
              variant="secondary"
              className={`p-3 flex flex-col items-center gap-1 h-auto ${config.color} text-white hover:opacity-90 transition-opacity`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center leading-tight">
                {config.label}
              </span>
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
}
