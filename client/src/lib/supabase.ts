import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://soquijyjpczhbuabembl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcXVpanlqcGN6aGJ1YWJlbWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTIwNDMsImV4cCI6MjA2NzkyODA0M30.GVZ1_XrRE0TrV69rYnuVL7xdm8o9u3NV90zZKfaqTUk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Helper function to get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

// Helper function to sign in anonymously
export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  return { data, error };
};

// Helper function to sign up with email
export const signUpWithEmail = async (email: string, password: string, nickname: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
        isAnonymous: false,
      }
    }
  });
  return { data, error };
};

// Helper function to sign in with email
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// Helper function to resend email verification
export const resendEmailVerification = async (email: string) => {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  return { data, error };
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper function to update user metadata
export const updateUserMetadata = async (metadata: Record<string, any>) => {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata
  });
  return { data, error };
};
