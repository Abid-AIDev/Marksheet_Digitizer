// src/app/login/page.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScanText, LogIn, UserPlus } from 'lucide-react';
import LoginImage from './img/login-image.jpeg';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');

  const supabase = createClient();

  // Validate email domain for JECC organization
  const validateJECCEmail = (email: string) => {
    const domain = email.split('@')[1];
    if (!domain || domain !== 'jecc.ac.in') {
      return false;
    }
    return true;
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail && !validateJECCEmail(newEmail)) {
      setEmailError('Only @jecc.ac.in email addresses are allowed for this organization.');
    } else {
      setEmailError('');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email domain before proceeding
    if (!validateJECCEmail(email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email Domain',
        description: 'Only @jecc.ac.in email addresses are allowed for this organization.',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Sign Up Successful!',
        description: 'Please check your email to verify your account.',
      });
      // Optionally, you can redirect or clear the form here
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
       toast({
        variant: 'destructive',
        title: 'Sign In Error',
        description: error ? error.message : 'Could not sign in. Please check your credentials.',
      });
    } else {
      // The middleware will handle the redirect on successful login
      // by detecting the auth state change.
      router.refresh(); // Refresh the page to trigger middleware check
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Left Panel */}
      <div className="md:w-1/2 lg:w-2/5 relative overflow-hidden hidden md:block">
        <Image
          src={LoginImage}
          alt="Modern workspace for efficient data processing"
          fill
          objectFit="cover"
          className="z-0"
          priority
          data-ai-hint="office education"
        />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full opacity-50 blur-3xl z-0"></div>
        <div className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-secondary/10 rounded-full opacity-50 blur-3xl z-0"></div>

        <div className="relative z-10 flex flex-col justify-between h-full px-8 pt-8 pb-6 md:px-12 md:pt-12 md:pb-8">
          <div>
            <Link href="/" className="flex items-center text-primary mb-12 hover:opacity-80 transition-opacity">
              <ScanText className="h-8 w-8 mr-2" />
              <span className="text-2xl font-bold">MarkSheet Digitizer</span>
            </Link>
          </div>
          <div className="flex-grow"></div>
          <div className="text-center md:text-left">
            <blockquote className="text-xl font-semibold italic mb-2 text-foreground">
              &ldquo;Streamlining evaluations, one marksheet at a time.&rdquo;
            </blockquote>
            <p className="text-sm text-foreground/80">- The MarkSheet Digitizer Team</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-3/5 flex items-center justify-center p-4 sm:p-8 md:p-12">
        <Card className="w-full max-w-md shadow-xl border-border/30">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="text-center pb-2">
                 <CardTitle className="text-3xl font-bold text-primary">Welcome</CardTitle>
                <CardDescription className="text-muted-foreground pt-1">
                    Enter your credentials to access the dashboard.
                </CardDescription>
                <TabsList className="grid w-full grid-cols-2 mt-4">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="relative">
                        Sign Up
                        <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">JECC Only</span>
                    </TabsTrigger>
                </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <Label htmlFor="email-signin">Email</Label>
                    <Input 
                      id="email-signin" 
                      type="email" 
                      placeholder="you@jecc.ac.in" 
                      value={email} 
                      onChange={handleEmailChange} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-signin">Password</Label>
                    <Input id="password-signin" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full text-lg py-3" disabled={loading}>
                    <LogIn className="mr-2 h-5 w-5" /> {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div>
                    <Label htmlFor="email-signup">Email</Label>
                    <Input 
                      id="email-signup" 
                      type="email" 
                      placeholder="you@jecc.ac.in" 
                      value={email} 
                      onChange={handleEmailChange} 
                      required 
                    />
                    {emailError && (
                      <p className="text-sm text-destructive mt-1">{emailError}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                   <Button type="submit" className="w-full text-lg py-3" disabled={loading || !!emailError}>
                    <UserPlus className="mr-2 h-5 w-5" /> {loading ? 'Signing Up...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-3 pt-4 border-t border-border/30">
                 <p className="text-xs text-muted-foreground px-4 text-center">
                    By signing up, you agree to our terms of service. New accounts require email verification.
                </p>
                 <p className="text-xs text-primary px-4 text-center font-medium">
                    🔒 Restricted to JECC organization members only (@jecc.ac.in)
                </p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
