import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Heart, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import type { MoodEmoji, User, MoodPost } from "@shared/schema";
import { useLocation } from "wouter";

interface PotentialMatch {
  id: string;
  user: User;
  post?: MoodPost;
  moodEmoji: MoodEmoji;
  nickname: string;
  isFromPost: boolean;
}

interface DiscoverMatchesProps {
  moodEmoji: MoodEmoji;
}

export default function DiscoverMatches() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get mood emoji from URL params (in a real app, this would come from routing)
  const [selectedMood] = useState<MoodEmoji>("😊");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Fetch potential matches for the selected mood
  const { data: matchesResponse, isLoading } = useQuery({
    queryKey: ['/api/potential-matches', selectedMood],
    enabled: !!selectedMood && !!user,
  });

  // Ensure potentialMatches is always an array
  const potentialMatches = Array.isArray(matchesResponse) ? matchesResponse : 
                          (matchesResponse?.potentialMatches && Array.isArray(matchesResponse.potentialMatches)) ? matchesResponse.potentialMatches : [];

  // Swipe mutation
  const swipeMutation = useMutation({
    mutationFn: async ({ swipedUserId, direction, postId }: {
      swipedUserId: string;
      direction: "left" | "right";
      postId?: string;
    }) => {
      return apiRequest({
        url: "/api/swipes",
        method: "POST",
        body: {
          swipedId: swipedUserId,
          direction,
          moodEmoji: selectedMood,
          postId,
        },
      });
    },
    onSuccess: (response, variables) => {
      if (response.matched && variables.direction === "right") {
        toast({
          title: "It's a match! 🎉",
          description: "You can now start chatting!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      }
      
      // Move to next match
      setCurrentMatchIndex(prev => prev + 1);
      setSwipeDirection(null);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again",
        variant: "destructive",
      });
      setSwipeDirection(null);
    },
  });

  const handleSwipe = (direction: "left" | "right") => {
    const currentMatch = potentialMatches[currentMatchIndex];
    if (!currentMatch || swipeMutation.isPending) return;

    setSwipeDirection(direction);
    
    swipeMutation.mutate({
      swipedUserId: currentMatch.user.id,
      direction,
      postId: currentMatch.post?.id,
    });
  };

  const currentMatch = potentialMatches[currentMatchIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-3xl h-96 mb-4"></div>
            <div className="flex justify-center gap-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMatch || currentMatchIndex >= potentialMatches.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-16 text-center">
          <div className="text-6xl mb-4">{selectedMood}</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            No More Matches
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Check back later for more people feeling {selectedMood}
          </p>
          <Button 
            onClick={() => setLocation("/mood-match")}
            className="w-full"
          >
            Find Different Mood
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/mood-match")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedMood}</span>
            <Badge variant="secondary">
              {potentialMatches.length - currentMatchIndex} left
            </Badge>
          </div>
          <div></div>
        </div>

        {/* Match Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: swipeDirection === "left" ? -300 : swipeDirection === "right" ? 300 : 0,
              rotate: swipeDirection === "left" ? -30 : swipeDirection === "right" ? 30 : 0,
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              x: swipeDirection === "left" ? -300 : 300,
              rotate: swipeDirection === "left" ? -30 : 30,
            }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Card className="h-96 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-0 h-full">
                <div className="relative h-full flex flex-col">
                  {/* Background mood emoji */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <span className="text-9xl">{currentMatch.moodEmoji}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {currentMatch.nickname}
                      </h3>
                      <span className="text-3xl">{currentMatch.moodEmoji}</span>
                    </div>
                    
                    {currentMatch.post && (
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                          "{currentMatch.post.text}"
                        </p>
                        
                        {currentMatch.post.mediaUrl && (
                          <div className="rounded-xl overflow-hidden mb-4">
                            {currentMatch.post.mediaType === "image" ? (
                              <img 
                                src={currentMatch.post.mediaUrl} 
                                alt="Post media"
                                className="w-full h-32 object-cover"
                              />
                            ) : currentMatch.post.mediaType === "video" ? (
                              <video 
                                src={currentMatch.post.mediaUrl}
                                className="w-full h-32 object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-500">Audio</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-auto">
                      <Badge variant="outline" className="mb-2">
                        {currentMatch.isFromPost ? "From their post" : "Same mood"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mt-8">
          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => handleSwipe("left")}
            disabled={swipeMutation.isPending}
          >
            <X className="h-8 w-8 text-red-500" />
          </Button>
          
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            onClick={() => handleSwipe("right")}
            disabled={swipeMutation.isPending}
          >
            <Heart className="h-8 w-8 text-white" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 px-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tap ❌ to pass or ❤️ to like
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            If they like you back, you'll match!
          </p>
        </div>
      </div>
    </div>
  );
}