import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, LogOut, Edit, Moon, Sun } from 'lucide-react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { BadgeDisplay } from '@/components/gamification/badge-display';
import { useAuthContext } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { User, Achievement, BadgeType } from '@shared/schema';

export default function Profile() {
  const { user, signOut } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const { data: userProfile } = useQuery<User>({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/user/achievements'],
    enabled: !!user,
  });

  const userBadges = achievements.map(a => a.badgeType) as BadgeType[];

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl">
                    {userProfile.nickname?.[0]?.toUpperCase() || '👤'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {userProfile.nickname || 'Anonymous User'}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant={userProfile.isAnonymous ? "secondary" : "outline"}>
                    {userProfile.isAnonymous ? 'Anonymous' : 'Public'}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.totalPosts || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.totalReactionsReceived || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Reactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {achievements.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Badges</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StreakCounter count={userProfile.streakCount || 0} />
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeDisplay badges={userBadges} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Toggle between light and dark theme
                  </div>
                </div>
                <Button variant="outline" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Account Type</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.is_anonymous ? 'Anonymous account' : 'Registered account'}
                  </div>
                </div>
                <Badge variant={user.is_anonymous ? "secondary" : "outline"}>
                  {user.is_anonymous ? 'Anonymous' : 'Registered'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
