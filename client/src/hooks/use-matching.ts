import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MoodEmoji, Swipe, Match } from "@shared/schema";

export function usePotentialMatches(moodEmoji: MoodEmoji) {
  return useQuery({
    queryKey: ['/api/potential-matches', moodEmoji],
    enabled: !!moodEmoji,
  });
}

export function useSwipe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ swipedUserId, direction, moodEmoji, postId }: {
      swipedUserId: string;
      direction: "left" | "right";
      moodEmoji: MoodEmoji;
      postId?: string;
    }) => {
      return apiRequest({
        url: "/api/swipes",
        method: "POST",
        body: {
          swipedId: swipedUserId,
          direction,
          moodEmoji,
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
      
      // Invalidate potential matches to get fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/potential-matches', variables.moodEmoji] 
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ['/api/matches'],
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['/api/matches', matchId],
    enabled: !!matchId,
  });
}