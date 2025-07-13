import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Send, 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  MoreVertical,
  Flag,
  Clock
} from "lucide-react";
import { formatDistance } from "date-fns";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage, Match, User, MoodEmoji } from "@shared/schema";
import { MOOD_EMOJIS } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaPreview } from "@/components/mood/media-preview";

interface ChatPageProps {
  matchId: string;
}

interface MatchWithUser extends Match {
  otherUser: User;
}

interface MessageWithExpiration extends ChatMessage {
  timeLeft: string;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get matchId from URL (in a real router, this would come from params)
  const matchId = "temp-match-id"; // In real app, extract from URL
  
  const [messageText, setMessageText] = useState("");
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState<MoodEmoji | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch match details
  const { data: match } = useQuery<MatchWithUser>({
    queryKey: ['/api/matches', matchId],
    enabled: !!matchId,
  });

  // Fetch messages with expiration info
  const { data: messages = [], isLoading } = useQuery<MessageWithExpiration[]>({
    queryKey: ['/api/matches', matchId, 'messages'],
    enabled: !!matchId,
    refetchInterval: 30000, // Refresh every 30 seconds for expiration updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
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
      setMessageText("");
      setSelectedMoodEmoji(null);
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

  // Report message mutation
  const reportMessageMutation = useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason: string }) => {
      return apiRequest({
        url: `/api/messages/${messageId}/report`,
        method: "POST",
        body: { reason },
      });
    },
    onSuccess: () => {
      toast({
        title: "Message reported",
        description: "Thank you for keeping the community safe",
      });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() && !selectedMoodEmoji) return;
    
    const content = selectedMoodEmoji ? `${selectedMoodEmoji} ${messageText}` : messageText;
    
    sendMessageMutation.mutate({
      content,
      messageType: selectedMoodEmoji && !messageText.trim() ? "emoji" : "text",
      moodEmoji: selectedMoodEmoji || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isMyMessage = (message: ChatMessage) => message.senderId === user?.id;

  if (isLoading || !match) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/matches")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
              {match.otherUser.nickname?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {match.otherUser.nickname || "Anonymous"}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg">{match.moodEmoji}</span>
              <span className="text-xs text-gray-500">
                Matched {formatDistance(new Date(match.createdAt), new Date(), { addSuffix: true })}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-red-600">
                <Flag className="mr-2 h-4 w-4" />
                Report User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto space-y-3">
          {/* Match announcement */}
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You matched because you both felt {match.moodEmoji}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Messages disappear after 24 hours
            </p>
          </div>

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex ${isMyMessage(message) ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs ${isMyMessage(message) ? "order-2" : "order-1"}`}>
                  <Card className={`${
                    isMyMessage(message) 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0" 
                      : "bg-gray-100 dark:bg-gray-700 border-0"
                  }`}>
                    <CardContent className="p-3">
                      {message.messageType === "text" || message.messageType === "emoji" ? (
                        <p className={`text-sm ${
                          isMyMessage(message) ? "text-white" : "text-gray-800 dark:text-white"
                        }`}>
                          {message.content}
                        </p>
                      ) : (
                        <MediaPreview 
                          url={message.content}
                          type={message.messageType as "image" | "video" | "audio"}
                          className="rounded-lg"
                        />
                      )}
                      
                      <div className={`flex items-center justify-between mt-2 text-xs ${
                        isMyMessage(message) ? "text-purple-100" : "text-gray-500 dark:text-gray-400"
                      }`}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{message.timeLeft}</span>
                        </div>
                        
                        {!isMyMessage(message) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => reportMessageMutation.mutate({
                              messageId: message.id,
                              reason: "inappropriate"
                            })}
                          >
                            Report
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mood Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="max-w-md mx-auto">
              <div className="grid grid-cols-7 gap-2">
                {MOOD_EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={selectedMoodEmoji === emoji ? "default" : "ghost"}
                    className="aspect-square text-2xl"
                    onClick={() => {
                      setSelectedMoodEmoji(selectedMoodEmoji === emoji ? null : emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-md mx-auto">
          {selectedMoodEmoji && (
            <div className="mb-2">
              <Badge variant="secondary" className="text-lg">
                {selectedMoodEmoji}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-4 w-4 p-0"
                  onClick={() => setSelectedMoodEmoji(null)}
                >
                  ×
                </Button>
              </Badge>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="border-gray-300 dark:border-gray-600"
                disabled={sendMessageMutation.isPending}
              />
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700"
              >
                😊
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
              >
                <Camera className="h-5 w-5" />
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={(!messageText.trim() && !selectedMoodEmoji) || sendMessageMutation.isPending}
                size="icon"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}