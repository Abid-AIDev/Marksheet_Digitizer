// src/app/login/page.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScanText, LogIn } from 'lucide-react';
import LoginImage from './img/login-image.jpeg'; // Import the local image

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    if (username === 'jyothi_teachers' && password === 'internal_marks') {
      // Set a flag in localStorage to indicate authentication
      localStorage.setItem('isAuthenticated', 'true');
      router.push('/'); // Redirect to main site
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Left Panel */}
      <div className="md:w-1/2 lg:w-2/5 relative overflow-hidden">
        <Image
          src={LoginImage}
          alt="Modern workspace for efficient data processing"
          fill
          objectFit="cover"
          className="z-0"
          priority
          data-ai-hint="office education"
        />
        {/* Decorative elements - will appear on top of the image */}
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full opacity-50 blur-3xl z-0"></div>
        <div className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-secondary/10 rounded-full opacity-50 blur-3xl z-0"></div>

        {/* Content Overlay with padding */}
        <div className="relative z-10 flex flex-col justify-between h-full px-8 pt-8 pb-6 md:px-12 md:pt-12 md:pb-8">
          <div>
            <Link href="/" className="flex items-center text-primary mb-12 hover:opacity-80 transition-opacity">
              <ScanText className="h-8 w-8 mr-2" />
              <span className="text-2xl font-bold">MarkSheet Digitizer</span>
            </Link>
          </div>
          
          <div className="flex-grow"></div> {/* Spacer */}

          <div className="text-center md:text-left">
            <blockquote className="text-xl font-semibold italic mb-2 text-foreground">
              &ldquo;Streamlining evaluations, one marksheet at a time.&rdquo;
            </blockquote>
            <p className="text-sm text-foreground/80">- The MarkSheet Digitizer Team</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="md:w-1/2 lg:w-3/5 flex items-center justify-center p-4 sm:p-8 md:p-12">
        <Card className="w-full max-w-md shadow-xl border-border/30">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
            <CardDescription className="text-muted-foreground">
              Log in to access the MarkSheet Digitizer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-foreground/80">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">
                  Remember me
                </Label>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="mr-2 h-5 w-5" /> Log In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-3 pt-6 border-t border-border/30">
             {/* Removed demo credentials hint and sign-up link */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
