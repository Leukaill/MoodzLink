import { supabase } from './supabase';
import { nanoid } from 'nanoid';

export interface SupabaseUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: 'image' | 'video' | 'audio' | 'raw';
  duration?: number;
}

export const uploadToSupabase = async (
  file: File,
  bucket: string = 'media-files'
): Promise<SupabaseUploadResult> => {
  console.log('Starting upload to Supabase:', { fileName: file.name, size: file.size, type: file.type, bucket });
  
  // Check authentication first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to upload files');
  }
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${nanoid()}.${fileExt}`;
  
  // Determine resource type based on file type
  let resourceType: 'image' | 'video' | 'audio' | 'raw' = 'raw';
  if (file.type.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.type.startsWith('video/')) {
    resourceType = 'video';
  } else if (file.type.startsWith('audio/')) {
    resourceType = 'audio';
  }

  console.log('Uploading with details:', { fileName, resourceType, userId: user.id });

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  console.log('Upload successful:', data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  console.log('Public URL:', urlData.publicUrl);

  return {
    public_id: fileName,
    secure_url: urlData.publicUrl,
    format: fileExt || '',
    resource_type: resourceType
  };
};

export const getOptimizedImageUrl = (
  fileName: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {},
  bucket: string = 'media-files'
): string => {
  // Supabase doesn't have built-in image transformations like Cloudinary
  // Return the direct URL - you can add image transformation service later if needed
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

export const getVideoThumbnailUrl = (fileName: string, bucket: string = 'media-files'): string => {
  // For video thumbnails, you would need to generate them server-side
  // For now, return a placeholder or the video URL itself
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

// Backwards compatibility - alias the new function
export const uploadToCloudinary = uploadToSupabase;
