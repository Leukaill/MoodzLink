import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MoodSelector } from '@/components/mood/mood-selector';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/auth-context';
import { DailyPhoto, MoodEmoji } from '@shared/schema';

export default function DailyPhotoPage() {
  const [selectedMood, setSelectedMood] = useState<MoodEmoji>('😊');
  const [caption, setCaption] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todaysPhoto } = useQuery<DailyPhoto>({
    queryKey: ['/api/daily-photos', today],
    enabled: !!user,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { photoUrl: string; moodEmoji: MoodEmoji; text?: string }) => {
      return apiRequest('POST', '/api/daily-photos', {
        ...data,
        datePosted: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-photos'] });
      toast({
        title: "Daily photo posted! 📸",
        description: "Your mood of the day has been captured."
      });
      setCapturedPhoto(null);
      setCaption('');
      stopCamera();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to post photo",
        description: error.message
      });
    }
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Camera access denied",
        description: "Please allow camera access to take your daily photo."
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) return;

    setIsUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const file = new File([blob], `daily-photo-${today}.jpg`, { type: 'image/jpeg' });

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);

      // Submit to backend
      await uploadPhotoMutation.mutateAsync({
        photoUrl: result.secure_url,
        moodEmoji: selectedMood,
        text: caption || undefined,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload your daily photo."
      });
    }
    setIsUploading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Please sign in to post daily photos</p>
      </div>
    );
  }

  // Show today's photo if already posted
  if (todaysPhoto) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
              Daily Photo
            </h1>
            <Camera className="h-5 w-5 text-primary" />
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{todaysPhoto.moodEmoji}</span>
                Today's Mood
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={todaysPhoto.photoUrl}
                alt="Today's mood"
                className="w-full rounded-lg"
              />
              {todaysPhoto.text && (
                <p className="text-gray-700 dark:text-gray-300">{todaysPhoto.text}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                You've already posted your mood for today! Come back tomorrow for a new photo.
              </p>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            Daily Photo
          </h1>
          <Camera className="h-5 w-5 text-primary" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Capture Your Mood of the Day
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share an authentic moment showing how you're feeling today. One photo per day!
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Camera/Photo Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4 relative">
                {!isCapturing && !capturedPhoto ? (
                  <div className="h-full flex items-center justify-center">
                    <Button
                      onClick={startCamera}
                      size="lg"
                      className="rounded-full h-16 w-16"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                ) : isCapturing ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <Button
                        onClick={capturePhoto}
                        size="lg"
                        className="rounded-full h-16 w-16 bg-white hover:bg-gray-100 text-gray-900"
                      >
                        <div className="w-12 h-12 rounded-full border-4 border-gray-900"></div>
                      </Button>
                    </div>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : capturedPhoto ? (
                  <>
                    <img
                      src={capturedPhoto}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                      <Button
                        onClick={retakePhoto}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-100"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retake
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>

              {capturedPhoto && (
                <>
                  {/* Mood Selector */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      How are you feeling?
                    </label>
                    <MoodSelector
                      selectedMood={selectedMood}
                      onMoodSelect={setSelectedMood}
                    />
                  </div>

                  {/* Caption */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Caption (Optional)
                    </label>
                    <Textarea
                      placeholder="Describe your mood..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={3}
                      maxLength={200}
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {caption.length}/200
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isUploading || uploadPhotoMutation.isPending}
                    className="w-full h-12"
                  >
                    {isUploading ? (
                      'Uploading...'
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Post Daily Photo
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      <BottomNav />
    </div>
  );
}
