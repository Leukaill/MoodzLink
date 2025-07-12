import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOOD_EMOJIS, type MoodEmoji } from '@shared/schema';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  selectedMood?: MoodEmoji;
  onMoodSelect: (mood: MoodEmoji) => void;
  className?: string;
}

export function MoodSelector({ selectedMood, onMoodSelect, className }: MoodSelectorProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {MOOD_EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          onClick={() => onMoodSelect(emoji)}
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all",
            selectedMood === emoji
              ? "border-primary bg-primary/10 scale-110"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
