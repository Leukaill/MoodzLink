import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StreakCounterProps {
  count: number;
  className?: string;
}

export function StreakCounter({ count, className }: StreakCounterProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-r from-orange-400 to-red-500 text-white">
        <CardContent className="p-4 flex items-center gap-3">
          <motion.div
            animate={{ rotate: count > 0 ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5, repeat: count > 0 ? Infinity : 0, repeatDelay: 2 }}
          >
            <Flame className="h-6 w-6" />
          </motion.div>
          <div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
