import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Heart, MessageSquare, BookMarked, Clock, Shield } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalGroups: 0,
    prayerRequests: 0,
    pendingTestimonies: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [users, pending, groups, prayers, testimonies] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
        supabase.from('study_groups').select('id', { count: 'exact', head: true }),
        supabase.from('prayer_requests').select('id', { count: 'exact', head: true }),
        supabase.from('testimonies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setStats({
        totalUsers: users.count || 0,
        pendingApprovals: pending.count || 0,
        totalGroups: groups.count || 0,
        prayerRequests: prayers.count || 0,
        pendingTestimonies: testimonies.count || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground font-body mt-1">Overview of your community</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard icon={<Users />} label="Total Users" value={stats.totalUsers} />
        <AdminStatCard icon={<Clock />} label="Pending Approvals" value={stats.pendingApprovals} highlight />
        <AdminStatCard icon={<Shield />} label="Active Groups" value={stats.totalGroups} />
        <AdminStatCard icon={<Heart />} label="Prayer Requests" value={stats.prayerRequests} />
        <AdminStatCard icon={<MessageSquare />} label="Pending Testimonies" value={stats.pendingTestimonies} highlight />
      </div>
    </div>
  );
}

function AdminStatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${highlight ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${highlight ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
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
