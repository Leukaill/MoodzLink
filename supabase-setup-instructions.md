# Supabase Setup Instructions for MoodLink

## Critical Steps to Complete:

### 1. Enable Anonymous Sign-ins
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/soquijyjpczhbuabembl
2. Navigate to **Authentication** → **Settings**
3. Find **"Enable anonymous sign-ins"** and toggle it **ON**
4. Click **Save**

### 2. Run Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase-schema.sql`
3. Paste it and click **Run**

### 3. Configure Site URL (for Google Auth later)
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://[your-replit-domain].replit.app`
3. Add **Redirect URLs**:
   - `https://[your-replit-domain].replit.app/auth/callback`
   - `http://localhost:5000/auth/callback`

## Current Status:
❌ Anonymous sign-ins: DISABLED (needs to be enabled)
❌ Database tables: NOT CREATED (schema needs to be run)
✅ Supabase connection: WORKING
✅ Auth flow code: READY

## After completing these steps:
- Anonymous authentication will work immediately
- Google auth can be configured later
- All app features will be functional