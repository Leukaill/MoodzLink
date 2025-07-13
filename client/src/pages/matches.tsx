import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Clock, ArrowLeft } from "lucide-react";
import { formatDistance } from "date-fns";
import { useLocation } from "wouter";
import type { Match, User } from "@shared/schema";

interface MatchWithUser extends Match {
  otherUser: User;
  unreadCount: number;
  lastMessagePreview?: string;
}

export default function Matches() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch user's matches
  const { data: matches = [], isLoading } = useQuery<MatchWithUser[]>({
    queryKey: ['/api/matches'],
    enabled: !!user,
  });

  const handleOpenChat = (matchId: string) => {
    setLocation(`/chat/${matchId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-20"></div>
            ))}
          </div>
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
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Your Matches
          </h1>
          <div></div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center pt-16">
            <div className="text-6xl mb-4">💫</div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              No matches yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Start exploring moods to find your perfect match!
            </p>
            <Button 
              onClick={() => setLocation("/mood-match")}
              className="w-full"
            >
              Discover Matches
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Card 
                key={match.id}
                className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenChat(match.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-purple-200 dark:border-purple-700">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg font-semibold">
                          {match.otherUser.nickname?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 text-lg">
                        {match.moodEmoji}
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                          {match.otherUser.nickname || "Anonymous"}
                        </h3>
                        <div className="flex items-center gap-2">
                          {match.unreadCount > 0 && (
                            <Badge 
                              variant="default"
                              className="bg-red-500 text-white text-xs px-2 py-1"
                            >
                              {match.unreadCount}
                            </Badge>
                          )}
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDistance(new Date(match.lastMessageAt || match.createdAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {match.lastMessagePreview ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {match.lastMessagePreview}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Start your conversation...
                        </p>
                      )}
                    </div>

                    {/* Chat Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bottom spacing for navigation */}
        <div className="h-24"></div>
      </div>
    </div>
  );
}