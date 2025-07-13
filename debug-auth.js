// Debug authentication and storage issues
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://soquijyjpczhbuabembl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcXVpanlqcGN6aGJ1YWJlbWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTIwNDMsImV4cCI6MjA2NzkyODA0M30.GVZ1_XrRE0TrV69rYnuVL7xdm8o9u3NV90zZKfaqTUk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing anonymous sign in...');
  
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Auth error:', error);
      return;
    }
    console.log('Auth success:', data);
    
    // Test storage bucket access
    console.log('Testing storage bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('Bucket error:', bucketError);
    } else {
      console.log('Available buckets:', buckets);
    }
    
    // Test file upload
    console.log('Testing file upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-files')
      .upload('test.txt', testFile);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
    } else {
      console.log('Upload success:', uploadData);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();