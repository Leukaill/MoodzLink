import { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getVideoThumbnailUrl } from '@/lib/cloudinary';

interface MediaPreviewProps {
  url: string;
  type: 'image' | 'video' | 'audio';
  className?: string;
}

export function MediaPreview({ url, type, className }: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  if (type === 'image') {
    return (
      <motion.div
        className={cn("rounded-lg overflow-hidden cursor-pointer", className)}
        onClick={() => setShowFullSize(!showFullSize)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={showFullSize ? url : getOptimizedImageUrl(url, { width: 400, height: 300 })}
          alt="Mood post media"
          className="w-full h-auto max-h-96 object-cover"
        />
      </motion.div>
    );
  }

  if (type === 'video') {
    return (
      <div className={cn("relative rounded-lg overflow-hidden", className)}>
        <video
          src={url}
          className="w-full h-auto max-h-96"
          controls
          poster={getVideoThumbnailUrl(url)}
        />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className={cn("bg-gray-100 dark:bg-gray-800 rounded-lg p-4", className)}>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-full h-10 w-10 p-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Audio message
              </span>
            </div>
            {/* Audio waveform placeholder */}
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gray-300 dark:bg-gray-600 rounded"
                  style={{ height: `${Math.random() * 20 + 10}px` }}
                />
              ))}
            </div>
          </div>
        </div>
        <audio
          src={url}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          hidden
        />
      </div>
    );
  }

  return null;
}
