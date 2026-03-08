import { BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
          <Clock className="h-10 w-10 text-accent" />
        </div>

        <div className="space-y-2">
          <BookOpen className="mx-auto h-8 w-8 text-accent mb-2" />
          <h1 className="font-heading text-3xl font-bold text-foreground">Awaiting Approval</h1>
          <p className="text-muted-foreground font-body leading-relaxed">
            Your account has been created successfully! An administrator will review and approve your
            account shortly. You'll be able to sign in once approved.
          </p>
        </div>

        <div className="rounded-lg bg-card border border-border p-4 shadow-soft">
          <p className="text-sm text-muted-foreground font-body italic">
            "Wait for the Lord; be strong, and let your heart take courage; wait for the Lord!"
            <br />— Psalm 27:14
          </p>
        </div>

        <Link to="/login">
          <Button variant="outline" className="mt-4 font-body">
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
