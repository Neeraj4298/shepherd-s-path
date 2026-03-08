import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string;
  instagram_username: string | null;
  status: string;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') {
      query = query.eq('status', filter as 'pending_approval' | 'approved' | 'banned');
    }
    const { data } = await query;
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const updateStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
    if (error) {
      toast.error('Failed to update user status');
    } else {
      toast.success(`User ${status === 'approved' ? 'approved' : status === 'banned' ? 'banned' : 'updated'}`);
      fetchUsers();
    }
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-green-500/10 text-green-400';
    if (s === 'pending_approval') return 'bg-accent/10 text-accent';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground font-body mt-1">Manage community members</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'pending_approval', 'approved', 'banned'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="font-body capitalize"
          >
            {f === 'pending_approval' ? 'Pending' : f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Instagram</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Joined</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-foreground font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.instagram_username || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(u.status)}`}>
                      {u.status === 'pending_approval' ? 'Pending' : u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {u.status !== 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(u.id, 'approved')} className="font-body text-xs">
                        Approve
                      </Button>
                    )}
                    {u.status !== 'banned' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(u.id, 'banned')} className="font-body text-xs text-destructive">
                        Ban
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
