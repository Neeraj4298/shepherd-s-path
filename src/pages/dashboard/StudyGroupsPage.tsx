import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export default function StudyGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (!groupsData || !user) { setLoading(false); return; }

    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    const memberSet = new Set(memberships?.map(m => m.group_id) || []);

    // Get member counts
    const enriched = await Promise.all(groupsData.map(async g => {
      const { count } = await supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', g.id);
      return { ...g, member_count: count || 0, is_member: memberSet.has(g.id) };
    }));

    setGroups(enriched);
    setLoading(false);
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
    if (error) toast.error('Failed to join group');
    else { toast.success('Joined group!'); fetchGroups(); }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    if (error) toast.error('Failed to leave group');
    else { toast.success('Left group'); fetchGroups(); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Study Groups</h1>
        <p className="text-muted-foreground font-body mt-1">Join a group and grow together</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-body">No study groups available yet. Ask your admin to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(g => (
            <div key={g.id} className="rounded-lg bg-card border border-border p-5 shadow-soft">
              <h3 className="font-heading text-lg font-semibold text-foreground">{g.name}</h3>
              {g.description && <p className="font-body text-muted-foreground mt-1 text-sm">{g.description}</p>}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                  <Users className="h-4 w-4" /> {g.member_count} members
                </span>
                {g.is_member ? (
                  <Button variant="outline" size="sm" onClick={() => leaveGroup(g.id)} className="font-body">
                    <LogOut className="h-4 w-4 mr-1" /> Leave
                  </Button>
                ) : (
                  <Button variant="gold" size="sm" onClick={() => joinGroup(g.id)} className="font-body">
                    <UserPlus className="h-4 w-4 mr-1" /> Join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
