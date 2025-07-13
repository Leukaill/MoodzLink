import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signInAnonymously, signUpWithEmail, signInWithEmail } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAnonymous: () => Promise<void>;
  signUpEmail: (email: string, password: string, nickname: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymous = async () => {
    try {
      const { error } = await signInAnonymously();
      if (error) throw error;
      toast({
        title: "Welcome to MoodzLink!",
        description: "You're now signed in anonymously. Share your mood!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message
      });
    }
  };

  const signUpEmail = async (email: string, password: string, nickname: string) => {
    try {
      const { error } = await signUpWithEmail(email, password, nickname);
      if (error) throw error;
      toast({
        title: "Check your email!",
        description: "We sent you a verification link to complete your registration."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message
      });
    }
  };

  const signInEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await signInWithEmail(email, password);
      if (error) throw error;
      
      // Check if this is a new user who needs onboarding
      if (data.user && data.user.user_metadata && !data.user.user_metadata.hasCompletedOnboarding) {
        toast({
          title: "Welcome to MoodzLink!",
          description: "Let's set up your profile."
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You're now signed in to MoodzLink."
        });
      }
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "Come back soon!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message
      });
    }
  };

  const value = {
    user,
    loading,
    signInAnonymous,
    signUpEmail,
    signInEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
