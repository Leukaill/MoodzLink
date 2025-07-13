import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Image, Video, Mic, X, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MoodSelector } from '@/components/mood/mood-selector';
import { uploadToSupabase } from '@/lib/cloudinary';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { insertMoodPostSchema } from '@shared/schema';

const createPostSchema = insertMoodPostSchema.extend({
  text: z.string().max(300, 'Text must be less than 300 characters').optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function CreatePost() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if user is not authenticated
  if (!user) {
    navigate('/');
    return null;
  }

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      moodEmoji: '😶‍🌫️',
      text: '',
      isAnonymous: false,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm & { mediaUrl?: string; mediaType?: string }) => {
      if (!user) throw new Error('Must be logged in to post');
      
      const { data: result, error } = await supabase
        .from('mood_posts')
        .insert({
          user_id: user.id,
          mood_emoji: data.moodEmoji,
          text: data.text,
          media_url: data.mediaUrl,
          media_type: data.mediaType,
          is_anonymous: data.isAnonymous,
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
      toast({
        title: "Mood posted!",
        description: "Your mood has been shared with the community."
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to post",
        description: error.message
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select a file smaller than 10MB"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setFilePreview(url);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CreatePostForm) => {
    if (!data.moodEmoji) {
      toast({
        variant: "destructive",
        title: "Select a mood",
        description: "Please select a mood emoji before posting"
      });
      return;
    }

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    // Upload file if selected
    if (selectedFile) {
      setIsUploading(true);
      try {
        const result = await uploadToSupabase(selectedFile);
        mediaUrl = result.secure_url;
        mediaType = selectedFile.type.startsWith('video/') ? 'video' :
                   selectedFile.type.startsWith('audio/') ? 'audio' : 'image';
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Failed to upload media file"
        });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createPostMutation.mutate({
      ...data,
      mediaUrl,
      mediaType,
    });
  };

  const isSubmitting = createPostMutation.isPending || isUploading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
            Share Your Mood
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mood Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FormField
                control={form.control}
                name="moodEmoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How are you feeling?</FormLabel>
                    <FormControl>
                      <MoodSelector
                        selectedMood={field.value as any}
                        onMoodSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Text Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's on your mind? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your thoughts..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <div className="text-right text-xs text-gray-500">
                      {field.value?.length || 0}/300
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Media Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Label>Add Media (Optional)</Label>
              
              {!selectedFile ? (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/*';
                        fileInputRef.current.click();
                      }
                    }}
                    className="h-12 flex-col gap-1"
                  >
                    <Image className="h-4 w-4" />
                    <span className="text-xs">Photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'video/*';
                        fileInputRef.current.click();
                      }
                    }}
                    className="h-12 flex-col gap-1"
                  >
                    <Video className="h-4 w-4" />
                    <span className="text-xs">Video</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'audio/*';
                        fileInputRef.current.click();
                      }
                    }}
                    className="h-12 flex-col gap-1"
                  >
                    <Mic className="h-4 w-4" />
                    <span className="text-xs">Audio</span>
                  </Button>
                </div>
              ) : (
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {selectedFile.type.startsWith('image/') && filePreview && (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  
                  {selectedFile.type.startsWith('video/') && filePreview && (
                    <video
                      src={filePreview}
                      className="w-full h-32 object-cover rounded"
                      controls
                    />
                  )}
                  
                  {selectedFile.type.startsWith('audio/') && (
                    <div className="flex items-center gap-3 py-4">
                      <Mic className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedFile.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>

            {/* Anonymous Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div>
                      <FormLabel>Post Anonymously</FormLabel>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hide your identity for this post
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-lg"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : isSubmitting ? (
                  'Posting...'
                ) : (
                  'Share Mood'
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </main>
    </div>
  );
}
