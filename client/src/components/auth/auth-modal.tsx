import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, UserX, Chrome } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInAnonymous, signInWithGoogle } = useAuthContext();
  const { toast } = useToast();

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    await signInAnonymous();
    setLoading(false);
    onOpenChange(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
    onOpenChange(false);
  };

  const handleEmailSignIn = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We sent you a magic link to sign in."
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to MoodLink</DialogTitle>
          <DialogDescription>
            Share your mood and connect with others who feel the same way.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Anonymous Sign In */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAnonymousSignIn}
              disabled={loading}
              className="w-full h-12 text-left justify-start gap-3"
              variant="outline"
            >
              <UserX className="h-5 w-5" />
              <div>
                <div className="font-medium">Continue Anonymously</div>
                <div className="text-xs text-gray-500">No account needed</div>
              </div>
            </Button>
          </motion.div>

          {/* Google Sign In */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 text-left justify-start gap-3"
              variant="outline"
            >
              <Chrome className="h-5 w-5" />
              <div>
                <div className="font-medium">Continue with Google</div>
                <div className="text-xs text-gray-500">Save your posts and data</div>
              </div>
            </Button>
          </motion.div>

          {/* Email Sign In */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Magic Link)</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleEmailSignIn}
                disabled={loading || !email}
                size="sm"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
