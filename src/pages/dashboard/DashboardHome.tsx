import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, BookMarked, Users, Flame } from 'lucide-react';

const dailyVerses = [
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For God so loved the world that he gave his one and only Son.", ref: "John 3:16" },
  { text: "The Lord is my light and my salvation—whom shall I fear?", ref: "Psalm 27:1" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
];

export default function DashboardHome() {
  const { profile } = useAuth();
  const verse = dailyVerses[new Date().getDay() % dailyVerses.length];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'friend'}
        </h1>
        <p className="text-muted-foreground font-body mt-1">Continue your spiritual journey today</p>
      </div>

      {/* Daily Scripture */}
      <div className="rounded-xl bg-gradient-navy p-6 shadow-card">
        <div className="flex items-start gap-4">
          <BookOpen className="h-8 w-8 text-accent shrink-0 mt-1" />
          <div>
            <p className="text-sm font-body text-primary-foreground/60 uppercase tracking-wider mb-2">Daily Scripture</p>
            <p className="font-heading text-xl text-primary-foreground italic leading-relaxed">
              "{verse.text}"
            </p>
            <p className="mt-2 text-sm font-body text-accent font-semibold">— {verse.ref}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Flame className="h-5 w-5" />} label="Reading Streak" value="0 days" />
        <StatCard icon={<BookMarked className="h-5 w-5" />} label="Chapters Read" value="0" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Groups Joined" value="0" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Get Started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction title="Start Bible Study" description="Track your reading progress through all 66 books" href="/dashboard/bible" />
          <QuickAction title="Join a Group" description="Connect with fellow believers in study groups" href="/dashboard/groups" />
          <QuickAction title="Prayer Room" description="Share prayer requests and pray for others" href="/dashboard/prayer" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground font-body">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="block rounded-lg bg-card border border-border p-5 shadow-soft hover:shadow-card hover:border-accent/30 transition-all duration-200"
    >
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground font-body mt-1">{description}</p>
    </a>
  );
}
