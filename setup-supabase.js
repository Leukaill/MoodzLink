// Automated Supabase setup script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://soquijyjpczhbuabembl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcXVpanlqcGN6aGJ1YWJlbWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTIwNDMsImV4cCI6MjA2NzkyODA0M30.GVZ1_XrRE0TrV69rYnuVL7xdm8o9u3NV90zZKfaqTUk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupSupabase() {
  console.log('Setting up Supabase storage buckets...');
  
  try {
    // Create media-files bucket
    const { data: mediaFilesData, error: mediaFilesError } = await supabase.storage
      .createBucket('media-files', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

    if (mediaFilesError && !mediaFilesError.message.includes('already exists')) {
      console.error('Error creating media-files bucket:', mediaFilesError);
    } else {
      console.log('✓ Created media-files bucket');
    }

    // Create profile-pictures bucket
    const { data: profilePicturesData, error: profilePicturesError } = await supabase.storage
      .createBucket('profile-pictures', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });

    if (profilePicturesError && !profilePicturesError.message.includes('already exists')) {
      console.error('Error creating profile-pictures bucket:', profilePicturesError);
    } else {
      console.log('✓ Created profile-pictures bucket');
    }

    console.log('✓ Supabase storage setup complete!');
    console.log('Note: Storage policies will be automatically handled by RLS on the storage objects.');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupSupabase();