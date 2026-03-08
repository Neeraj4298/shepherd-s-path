import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminAnalytics() {
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [bookStats, setBookStats] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // User status breakdown
    const { data: profiles } = await supabase.from('profiles').select('status');
    if (profiles) {
      const counts: Record<string, number> = {};
      profiles.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
      setStatusBreakdown(Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
    }

    // Most read books (top 10)
    const { data: progress } = await supabase.from('bible_study_progress').select('chapter_id');
    if (progress && progress.length > 0) {
      const { data: chapters } = await supabase.from('bible_chapters').select('id, book_id');
      const { data: books } = await supabase.from('bible_books').select('id, name');
      if (chapters && books) {
        const bookMap = new Map(books.map(b => [b.id, b.name]));
        const chapterBookMap = new Map(chapters.map(c => [c.id, c.book_id]));
        const bookCounts: Record<string, number> = {};
        progress.forEach(p => {
          const bookId = chapterBookMap.get(p.chapter_id);
          if (bookId) {
            const bookName = bookMap.get(bookId) || 'Unknown';
            bookCounts[bookName] = (bookCounts[bookName] || 0) + 1;
          }
        });
        setBookStats(
          Object.entries(bookCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, chapters]) => ({ name, chapters }))
        );
      }
    }
  };

  const COLORS = ['hsl(43, 80%, 52%)', 'hsl(220, 50%, 28%)', 'hsl(0, 72%, 51%)', 'hsl(120, 40%, 50%)'];

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Status Breakdown */}
        <div className="rounded-lg bg-card border border-border p-5 shadow-soft">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">User Status</h2>
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground font-body text-sm">No data yet.</p>}
        </div>

        {/* Most Read Books */}
        <div className="rounded-lg bg-card border border-border p-5 shadow-soft">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Most Read Books</h2>
          {bookStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bookStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="chapters" fill="hsl(43, 80%, 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground font-body text-sm">No reading data yet.</p>}
        </div>
      </div>
    </div>
  );
}
