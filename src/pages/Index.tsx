import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
          <BookOpen className="h-8 w-8 text-accent-foreground" />
        </div>

        <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-4">
          Shepherd Hub
        </h1>
        <p className="text-xl text-muted-foreground font-body max-w-lg mb-8 leading-relaxed">
          A faith-based community for spiritual growth, Bible study, prayer, and fellowship.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register">
            <Button variant="gold" size="lg" className="min-w-[160px]">Join the Community</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="min-w-[160px]">Sign In</Button>
          </Link>
        </div>

        <div className="mt-16 max-w-md">
          <div className="rounded-xl bg-card border border-border p-6 shadow-soft">
            <p className="font-heading text-lg italic text-foreground leading-relaxed">
              "Come to me, all you who are weary and burdened, and I will give you rest."
            </p>
            <p className="mt-3 text-sm font-body text-accent font-semibold">— Matthew 11:28</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground font-body border-t border-border">
        Shepherd Hub — Growing together in faith
      </footer>
    </div>
  );
};

export default Index;
