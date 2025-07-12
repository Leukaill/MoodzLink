# Setting up Google Auth for MoodLink

## Steps to configure Google OAuth in Supabase:

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Select **Web application** as the application type
6. Add these URLs to **Authorized redirect URIs**:
   - `https://soquijyjpczhbuabembl.supabase.co/auth/v1/callback`
   - `http://localhost:5000/auth/callback` (for local development)
7. Note down the **Client ID** and **Client Secret**

### 2. Configure Supabase Authentication
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/soquijyjpczhbuabembl)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Enable**
4. Enter your Google OAuth credentials:
   - **Client ID**: (from step 1)
   - **Client Secret**: (from step 1)
5. Click **Save**

### 3. Set up Site URL (Important!)
1. Still in Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to: `https://your-replit-domain.replit.app` (or your custom domain)
3. Add **Additional Redirect URLs**:
   - `https://your-replit-domain.replit.app/auth/callback`
   - `http://localhost:5000/auth/callback`

### 4. Run the Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Copy and paste the entire content of `supabase-schema.sql`
3. Click **Run** to create all tables and set up the database

### 5. Test the Authentication
1. The app should now be running with Google Auth enabled
2. Try both Anonymous and Google sign-in options
3. Check that user profiles are created automatically in the database

## Current Status
✅ Google Auth client-side setup complete
✅ Auth callback page created
✅ Database schema ready
⏳ Waiting for Google OAuth credentials and Supabase configuration

## Notes
- The app will redirect to `/auth/callback` after Google OAuth
- Anonymous authentication still works as a fallback
- User profiles are automatically created in the database
- All authentication flows are handled by Supabase