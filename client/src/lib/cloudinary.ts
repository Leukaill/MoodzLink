export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: 'image' | 'video' | 'raw' | 'auto';
  duration?: number;
}

export const uploadToCloudinary = async (
  file: File,
  uploadPreset: string = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'moodlink_uploads'
): Promise<CloudinaryUploadResult> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  // Auto-detect resource type based on file type
  if (file.type.startsWith('video/')) {
    formData.append('resource_type', 'video');
  } else if (file.type.startsWith('audio/')) {
    formData.append('resource_type', 'raw');
  } else {
    formData.append('resource_type', 'image');
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload file to Cloudinary');
  }

  return response.json();
};

export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  let transformations = [];
  
  if (width || height) {
    transformations.push(`c_fill,${width ? `w_${width}` : ''}${height ? `h_${height}` : ''}`);
  }
  
  if (quality) {
    transformations.push(`q_${quality}`);
  }
  
  if (format) {
    transformations.push(`f_${format}`);
  }
  
  const transformString = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
};

export const getVideoThumbnailUrl = (publicId: string): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  return `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,w_400,h_300,f_jpg/${publicId}.jpg`;
};
