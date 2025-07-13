# Supabase Storage Setup Instructions

## Storage Buckets to Create

In your Supabase dashboard, go to Storage section and create these buckets:

### 1. media-files
- **Name**: `media-files`
- **Public**: Yes (allow public access)
- **File size limit**: 10MB
- **Allowed file types**: image/*, video/*, audio/*

### 2. profile-pictures  
- **Name**: `profile-pictures`
- **Public**: Yes (allow public access)
- **File size limit**: 5MB
- **Allowed file types**: image/*

## Storage Policies

After creating the buckets, set up these storage policies:

### For media-files bucket:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media-files' AND 
  auth.role() = 'authenticated'
);
```

**Policy 2: Allow public access to files**
```sql
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'media-files');
```

### For profile-pictures bucket:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated users to upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' AND 
  auth.role() = 'authenticated'
);
```

**Policy 2: Allow public access to profile pictures**
```sql
CREATE POLICY "Allow public access to profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');
```

## Steps to Complete Setup:

1. **Database Schema**: Run the SQL in `supabase-setup.sql` in your Supabase SQL Editor
2. **Storage Buckets**: Create the buckets as described above
3. **Storage Policies**: Add the storage policies using the SQL commands above
4. **Environment Variables**: Set your DATABASE_URL with your actual password
5. **Test**: Try uploading a file through the app to verify everything works

## Environment Variables Needed:

```
VITE_SUPABASE_URL=https://soquijyjpczhbuabembl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcXVpanlqcGN6aGJ1YWJlbWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTIwNDMsImV4cCI6MjA2NzkyODA0M30.GVZ1_XrRE0TrV69rYnuVL7xdm8o9u3NV90zZKfaqTUk
DATABASE_URL=postgresql://postgres:[YOUR-ACTUAL-PASSWORD]@db.soquijyjpczhbuabembl.supabase.co:5432/postgres
```

Replace `[YOUR-ACTUAL-PASSWORD]` with the password you set when creating your Supabase project.