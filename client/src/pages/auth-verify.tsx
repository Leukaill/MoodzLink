import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AuthVerify() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('loading');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if this is a verification callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (type === 'signup' && accessToken && refreshToken) {
      // This is an email verification callback
      handleEmailVerification(accessToken, refreshToken);
    } else {
      // This is the waiting page (user just signed up)
      setStatus('waiting');
    }
  }, []);

  const handleEmailVerification = async (accessToken: string, refreshToken: string) => {
    try {
      // Set the session with the tokens from email verification
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;

      if (data.user) {
        setStatus('success');
        toast({
          title: "Email verified!",
          description: "Your account is now active. You can sign in.",
        });

        // Redirect to home after a short delay
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handleBackToSignIn = () => {
    setLocation('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-4"
            >
              <Loader2 className="h-12 w-12 text-blue-500" />
            </motion.div>
            <CardTitle>Verifying your email...</CardTitle>
            <CardDescription>
              Please wait while we verify your email address.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-4"
            >
              <Mail className="h-12 w-12 text-blue-500" />
            </motion.div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent you a verification link. Click the link in your email to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              After clicking the verification link, you'll be redirected back here and then to the sign-in page.
            </p>
            <Button
              onClick={handleBackToSignIn}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="mx-auto mb-4"
            >
              <CheckCircle className="h-12 w-12 text-green-500" />
            </motion.div>
            <CardTitle className="text-green-700 dark:text-green-400">
              Email verified successfully!
            </CardTitle>
            <CardDescription>
              Your account is now active. You'll be redirected to sign in shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Redirecting you to the app...
              </p>
              <Button
                onClick={handleBackToSignIn}
                className="w-full"
              >
                Continue to Sign In
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="mx-auto mb-4"
            >
              <XCircle className="h-12 w-12 text-red-500" />
            </motion.div>
            <CardTitle className="text-red-700 dark:text-red-400">
              Verification failed
            </CardTitle>
            <CardDescription>
              There was a problem verifying your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {error || 'An unexpected error occurred during verification.'}
            </p>
            <Button
              onClick={handleBackToSignIn}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}