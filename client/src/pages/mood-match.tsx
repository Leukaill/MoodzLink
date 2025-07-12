import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Shuffle, ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoodSelector } from '@/components/mood/mood-selector';
import { useAuthContext } from '@/contexts/auth-context';
import { MoodMatch, MoodEmoji } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function MoodMatchPage() {
  const [selectedMood, setSelectedMood] = useState<MoodEmoji>('😶‍🌫️');
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const { data: currentMatches = [] } = useQuery<MoodMatch[]>({
    queryKey: ['/api/mood-matches'],
    enabled: !!user,
  });

  // Ensure currentMatches is always an array
  const safeCurrentMatches = Array.isArray(currentMatches) ? currentMatches : [];

  const findMatchMutation = useMutation({
    mutationFn: async (moodEmoji: MoodEmoji) => {
      return apiRequest('POST', '/api/mood-matches/find', { moodEmoji });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood-matches'] });
      if (data.match) {
        toast({
          title: "Match found! 🎉",
          description: "You've been connected with someone who feels the same way."
        });
      } else {
        toast({
          title: "No matches yet",
          description: "We'll notify you when someone with the same mood joins!"
        });
      }
      setIsSearching(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to find match",
        description: error.message
      });
      setIsSearching(false);
    }
  });

  const handleFindMatch = () => {
    setIsSearching(true);
    findMatchMutation.mutate(selectedMood);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Please sign in to use mood matching</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            Mood Match
          </h1>
          <Heart className="h-5 w-5 text-primary" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Match Finder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Find Someone Like You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  How are you feeling?
                </label>
                <MoodSelector
                  selectedMood={selectedMood}
                  onMoodSelect={setSelectedMood}
                />
              </div>

              <Button
                onClick={handleFindMatch}
                disabled={isSearching || findMatchMutation.isPending}
                className="w-full h-12"
              >
                {isSearching ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Heart className="h-4 w-4" />
                    </motion.div>
                    Searching for matches...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Find My Mood Twin
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                We'll connect you with someone who recently posted the same mood emoji
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {safeCurrentMatches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">💫</div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    No matches yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Find someone who feels the same way as you!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {safeCurrentMatches.map((match) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-lg">
                            {match.moodEmoji}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              Mood Twin
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {match.moodEmoji}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Connected via shared feelings
                          </p>
                        </div>
                        <Link href={`/chat/${match.id}`}>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>How Mood Matching Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="text-lg">1️⃣</div>
                <div>
                  <div className="font-medium text-sm">Select Your Mood</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Choose how you're feeling right now
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-lg">2️⃣</div>
                <div>
                  <div className="font-medium text-sm">Find Your Twin</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    We'll match you with someone who feels the same
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-lg">3️⃣</div>
                <div>
                  <div className="font-medium text-sm">Connect & Chat</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Start a conversation and support each other
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
