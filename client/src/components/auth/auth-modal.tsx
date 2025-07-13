import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  });

  const { signInAnonymous, signUpEmail, signInEmail } = useAuthContext();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      await signInAnonymous();
      onOpenChange(false);
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "Please try again."
      });
    }
    setIsLoading(false);
  };

  const validateForm = () => {
    if (isSignUp) {
      if (!formData.email || !formData.password || !formData.nickname) {
        toast({
          variant: "destructive",
          title: "Missing fields",
          description: "Please fill in all required fields."
        });
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Passwords don't match",
          description: "Please make sure your passwords match."
        });
        return false;
      }
      if (formData.password.length < 6) {
        toast({
          variant: "destructive",
          title: "Password too short",
          description: "Password must be at least 6 characters long."
        });
        return false;
      }
    } else {
      if (!formData.email || !formData.password) {
        toast({
          variant: "destructive",
          title: "Missing fields",
          description: "Please fill in email and password."
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpEmail(formData.email, formData.password, formData.nickname);
        // Redirect to verification page after successful signup
        onOpenChange(false);
        setLocation('/auth/verify');
      } else {
        await signInEmail(formData.email, formData.password);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      nickname: ''
    });
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to MoodzLink</DialogTitle>
          <DialogDescription>
            Share your mood and connect with others who feel the same way.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Anonymous Sign In */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAnonymousSignIn}
              disabled={isLoading}
              className="w-full h-12 text-left justify-start gap-3"
              variant="outline"
            >
              <UserX className="h-5 w-5" />
              <div>
                <div className="font-medium">Continue Anonymously</div>
                <div className="text-xs text-gray-500">No account needed</div>
              </div>
            </Button>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </CardTitle>
              <CardDescription>
                {isSignUp 
                  ? 'Create an account to save your posts and connect with friends'
                  : 'Sign in to your existing account'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="nickname"
                        type="text"
                        placeholder="Choose a nickname"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>

                {isSignUp && (
                  <p className="text-xs text-gray-500 text-center">
                    By creating an account, you'll receive an email verification link.
                  </p>
                )}
              </form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={switchMode}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}