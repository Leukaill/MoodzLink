import { Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/auth-context';

export function FloatingActionButton() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();

  const handleClick = () => {
    if (!user) {
      // User is not authenticated, show auth modal or redirect to home
      setLocation('/');
      return;
    }
    // User is authenticated, go to create post
    setLocation('/create-post');
  };

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
        onClick={handleClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}
