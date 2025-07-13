import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Edit, Moon, Sun, Save, X, Upload } from 'lucide-react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { BadgeDisplay } from '@/components/gamification/badge-display';
import { useAuthContext } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabase } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { User, Achievement, BadgeType } from '@shared/schema';

export default function Profile() {
  const { user, signOut } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: user?.user_metadata?.nickname || '',
    profilePicture: user?.user_metadata?.profilePictureUrl || ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: userProfile } = useQuery<User>({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/user/achievements'],
    enabled: !!user,
  });

  // Ensure achievements is always an array
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const userBadges = safeAchievements.map(a => a.badgeType) as BadgeType[];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select a file smaller than 5MB"
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadToSupabase(file, 'profile-pictures');
      setEditForm(prev => ({ ...prev, profilePicture: result.secure_url }));
      toast({
        title: "Picture uploaded!",
        description: "Your profile picture has been updated."
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again."
      });
    }
    setIsUploading(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nickname: editForm.nickname,
          profilePictureUrl: editForm.profilePicture
        }
      });

      if (authError) throw authError;

      // Also update the users table directly
      const { error: dbError } = await supabase
        .from('users')
        .update({
          nickname: editForm.nickname,
          profile_picture_url: editForm.profilePicture
        })
        .eq('id', user?.id);

      if (dbError) throw dbError;

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved."
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update profile. Please try again."
      });
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      nickname: user?.user_metadata?.nickname || '',
      profilePicture: user?.user_metadata?.profilePictureUrl || ''
    });
    setIsEditing(false);
  };

  if (!user) {
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
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 mb-4"
                  >
                    <Avatar className="h-16 w-16">
                      {editForm.profilePicture ? (
                        <AvatarImage src={editForm.profilePicture} />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {user?.user_metadata?.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '👤'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {user?.user_metadata?.nickname || user?.email?.split('@')[0] || 'Anonymous User'}
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      {user?.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {user.email}
                        </p>
                      )}
                      <Badge variant={user?.is_anonymous ? "secondary" : "outline"}>
                        {user?.is_anonymous ? 'Anonymous' : 'Registered'}
                      </Badge>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 mb-4"
                  >
                    {/* Profile Picture Upload */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {editForm.profilePicture ? (
                          <AvatarImage src={editForm.profilePicture} />
                        ) : (
                          <AvatarFallback className="text-2xl">
                            {editForm.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '👤'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="profile-edit-upload"
                        />
                        <label htmlFor="profile-edit-upload">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? 'Uploading...' : 'Change Photo'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>

                    {/* Nickname Input */}
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        value={editForm.nickname}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="Enter your nickname"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving || isUploading}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        disabled={isSaving || isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats */}
              {!isEditing && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userProfile?.totalPosts || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userProfile?.totalReactionsReceived || 0}
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
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Counter */}
        {!isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StreakCounter count={userProfile?.streakCount || 0} />
          </motion.div>
        )}

        {/* Badges */}
        {!isEditing && (
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
        )}

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
