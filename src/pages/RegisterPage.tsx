import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [instagram, setInstagram] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, instagram || undefined);

    if (error) {
      setError(error.message);
    } else {
      navigate('/pending');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-navy flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-accent mb-6" />
          <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">Shepherd Hub</h1>
          <p className="text-lg text-primary-foreground/70 max-w-md font-body">
            "For where two or three gather in my name, there am I with them." — Matthew 18:20
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <BookOpen className="mx-auto h-10 w-10 text-accent mb-3" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Shepherd Hub</h1>
          </div>

          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground">Join the flock</h2>
            <p className="mt-2 text-muted-foreground font-body">Create your account to start growing spiritually</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-body">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-body">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required className="font-body" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="font-body" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="font-body" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="font-body">Instagram Username <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourusername" className="font-body" />
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
