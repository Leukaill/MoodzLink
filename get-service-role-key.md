# How to Get Your Supabase Service Role Key

## Step-by-Step Instructions:

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Select your project** (soquijyjpczhbuabembl)
3. **Click on Settings** (gear icon in the left sidebar)
4. **Click on API** in the settings menu
5. **In the "Project API keys" section**, you'll see two keys:
   - `anon` `public` (this is what we already have)
   - `service_role` `secret` ← **This is what I need**

6. **Click the "Copy" button** next to the `service_role` key
7. **Paste it here** in the chat

## What this key does:
- Has admin privileges to create storage buckets
- Can bypass Row Level Security for setup operations
- Allows me to automate the entire storage setup

## Security Note:
This key has full admin access to your Supabase project, so only share it in secure environments like this. Once I create the buckets, you won't need to share it again.

The key will look something like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (but much longer)