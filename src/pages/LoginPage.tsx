import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setIsLoading(true);

    const { error, status } = await signIn(email, password);

    if (error) {
      setError(error.message || 'Invalid credentials');
    } else if (status === 'pending_approval') {
      setStatusMessage('Your account is awaiting admin approval. Please check back later.');
    } else if (status === 'banned') {
      setStatusMessage('Your account has been suspended. Please contact support.');
    } else {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-navy flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-accent mb-6" />
          <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">Shepherd Hub</h1>
          <p className="text-lg text-primary-foreground/70 max-w-md font-body">
            "The Lord is my shepherd; I shall not want." — Psalm 23:1
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <BookOpen className="mx-auto h-10 w-10 text-accent mb-3" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Shepherd Hub</h1>
          </div>

          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground font-body">Sign in to continue your spiritual journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-body">{error}</div>
            )}
            {statusMessage && (
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-sm text-foreground font-body">{statusMessage}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="font-body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="font-body"
              />
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
