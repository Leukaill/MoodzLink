import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MoodEmoji } from "@shared/schema";

export function useMessages(matchId: string) {
  return useQuery({
    queryKey: ['/api/matches', matchId, 'messages'],
    enabled: !!matchId,
    refetchInterval: 30000, // Refresh every 30 seconds for expiration updates
  });
}

export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ content, messageType, moodEmoji }: {
      content: string;
      messageType: "text" | "image" | "audio" | "video" | "emoji";
      moodEmoji?: MoodEmoji;
    }) => {
      return apiRequest({
        url: `/api/matches/${matchId}/messages`,
        method: "POST",
        body: {
          content,
          messageType,
          moodEmoji,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });
}

export function useReportMessage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ messageId, reason, description }: {
      messageId: string;
      reason: string;
      description?: string;
    }) => {
      return apiRequest({
        url: `/api/messages/${messageId}/report`,
        method: "POST",
        body: { reason, description },
      });
    },
    onSuccess: () => {
      toast({
        title: "Message reported",
        description: "Thank you for keeping the community safe",
      });
    },
    onError: () => {
      toast({
        title: "Failed to report message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });
}

export function useCleanupExpiredMessages() {
  return useMutation({
    mutationFn: async () => {
      return apiRequest({
        url: "/api/messages/expired",
        method: "DELETE",
      });
    },
  });
}