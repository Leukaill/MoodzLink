import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, ArrowRight, Check, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoodSelector } from '@/components/mood/mood-selector';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { MoodEmoji } from '@shared/schema';

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to MoodzLink!',
    description: 'Let\'s set up your profile and show you around',
    icon: Heart
  },
  {
    id: 'profile-picture',
    title: 'Add a Profile Picture',
    description: 'Upload a photo or skip this step',
    icon: Camera
  },
  {
    id: 'mood-tour',
    title: 'Share Your First Mood',
    description: 'Try selecting how you\'re feeling right now',
    icon: User
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start sharing and connecting with others',
    icon: Check
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'profile_pictures');
      setProfilePicture(result.secure_url);
      toast({
        title: "Picture uploaded!",
        description: "Your profile picture has been set."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload profile picture. You can try again later."
      });
    }
    setIsUploading(false);
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          profilePictureUrl: profilePicture,
          hasCompletedOnboarding: true
        }
      });

      if (error) throw error;

      toast({
        title: "Welcome to MoodzLink!",
        description: "Your profile is now set up. Start sharing your mood!"
      });

      setLocation('/');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete setup. Please try again."
      });
    }
    setIsCompleting(false);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const skipStep = () => {
    nextStep();
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="p-6 pb-0">
          <div className="flex justify-between mb-6">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStep
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < onboardingSteps.length - 1 && (
                  <div
                    className={`h-1 w-12 mt-2 transition-colors ${
                      index < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <CardHeader className="text-center">
          <motion.div
            key={currentStep}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <currentStepData.icon className="h-12 w-12 text-purple-500" />
          </motion.div>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {user?.user_metadata?.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '👤'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{user?.user_metadata?.nickname || 'New User'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome! We'll help you set up your profile and show you how to use MoodzLink.
                </p>
                <Button onClick={nextStep} className="w-full">
                  Let's Get Started <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  {profilePicture ? (
                    <AvatarImage src={profilePicture} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {user?.user_metadata?.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '👤'}
                    </AvatarFallback>
                  )}
                </Avatar>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="profile-upload"
                />
                
                <div className="space-y-2">
                  <label htmlFor="profile-upload">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </Button>
                  </label>
                  
                  <Button onClick={skipStep} variant="ghost" className="w-full">
                    Skip for now
                  </Button>
                  
                  {profilePicture && (
                    <Button onClick={nextStep} className="w-full">
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Try selecting a mood to see how it works:
                </p>
                
                <MoodSelector
                  selectedMood={selectedMood}
                  onMoodSelect={setSelectedMood}
                  className="justify-center"
                />

                {selectedMood && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Great! You selected {selectedMood}. This is how you'll share your mood with others.
                    </p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Button 
                    onClick={nextStep} 
                    className="w-full"
                    disabled={!selectedMood}
                  >
                    {selectedMood ? 'Got it!' : 'Select a mood to continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <Button onClick={skipStep} variant="ghost" className="w-full">
                    Skip tutorial
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="space-y-3"
                >
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Profile Complete
                  </Badge>
                  
                  <div className="space-y-2">
                    <p className="font-medium">You can now:</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Share your daily mood posts</li>
                      <li>• Connect with others who feel the same</li>
                      <li>• Chat with your mood matches</li>
                      <li>• Earn badges and build streaks</li>
                    </ul>
                  </div>
                </motion.div>

                <Button onClick={completeOnboarding} className="w-full" disabled={isCompleting}>
                  {isCompleting ? 'Setting up...' : 'Start Using MoodzLink'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}