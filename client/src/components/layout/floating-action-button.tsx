import { Plus } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function FloatingActionButton() {
  return (
    <motion.div
      className="fixed bottom-20 right-4 z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Link href="/create-post">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </motion.div>
  );
}
