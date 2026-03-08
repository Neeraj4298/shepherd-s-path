import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Lock, Eye, EyeOff, Megaphone, MessageSquare, UserPlus } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  chat_mode: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

export default function AdminGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private_visible' | 'private_hidden'>('public');
  const [chatMode, setChatMode] = useState<'open' | 'broadcast'>('open');
  const [creating, setCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const fetchGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (data) setGroups(data);
  };

  const fetchMembers = async (groupId: string) => {
    const { data } = await supabase.from('group_members').select('id, user_id, profiles(full_name)').eq('group_id', groupId);
    if (data) setMembers(data as any);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('status', 'approved');
    if (data) setAllUsers(data);
  };

  useEffect(() => { fetchGroups(); fetchAllUsers(); }, []);

  const create = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);
    const { data: group, error } = await supabase.from('study_groups').insert({
      name: name.trim(),
      description: description.trim() || null,
      created_by: user.id,
      visibility,
      chat_mode: chatMode,
    }).select().single();

    if (error) { toast.error('Failed to create group'); setCreating(false); return; }

    // Auto-create a chat room for this group
    if (group) {
      await supabase.from('chat_rooms').insert({
        name: `${name.trim()} Chat`,
        type: 'group' as const,
        group_id: group.id,
      });
    }

    toast.success('Group created with chat room!');
    setName(''); setDescription(''); setVisibility('public'); setChatMode('open');
    fetchGroups();
    setCreating(false);
  };

  const remove = async (id: string) => {
    await supabase.from('study_groups').delete().eq('id', id);
    toast.success('Group deleted'); setSelectedGroup(null); fetchGroups();
  };

  const openGroup = (g: StudyGroup) => {
    setSelectedGroup(g);
    fetchMembers(g.id);
    setAddingUser(false);
  };

  const addMember = async (userId: string) => {
    if (!selectedGroup) return;
    const { error } = await supabase.from('group_members').insert({ group_id: selectedGroup.id, user_id: userId });
    if (error) toast.error(error.message);
    else { toast.success('Member added'); fetchMembers(selectedGroup.id); }
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('group_members').delete().eq('id', memberId);
    toast.success('Member removed');
    if (selectedGroup) fetchMembers(selectedGroup.id);
  };

  const updateGroup = async (field: string, value: string) => {
    if (!selectedGroup) return;
    await supabase.from('study_groups').update({ [field]: value }).eq('id', selectedGroup.id);
    toast.success('Group updated');
    fetchGroups();
    setSelectedGroup({ ...selectedGroup, [field]: value });
  };

  const visibilityIcon = (v: string) => {
    if (v === 'public') return <Eye className="h-4 w-4 text-green-400" />;
    if (v === 'private_visible') return <Lock className="h-4 w-4 text-accent" />;
    return <EyeOff className="h-4 w-4 text-muted-foreground" />;
  };

  const visibilityLabel = (v: string) => {
    if (v === 'public') return 'Public';
    if (v === 'private_visible') return 'Private (Visible)';
    return 'Private (Hidden)';
  };

  const nonMembers = allUsers.filter(u => !members.some(m => m.user_id === u.id)).filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Group Management</h1>

      {selectedGroup ? (
        <div className="space-y-5">
          <button onClick={() => setSelectedGroup(null)} className="text-sm text-accent hover:underline font-body">← Back to groups</button>

          <div className="rounded-xl bg-card border border-border p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedGroup.name}</h2>
              <Button size="sm" variant="outline" onClick={() => remove(selectedGroup.id)} className="text-destructive font-body">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>

            {selectedGroup.description && <p className="text-muted-foreground font-body">{selectedGroup.description}</p>}

            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body font-medium">Visibility</Label>
                <select
                  value={selectedGroup.visibility}
                  onChange={e => updateGroup('visibility', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
                >
                  <option value="public">🌐 Public — Anyone can see & join</option>
                  <option value="private_visible">🔒 Private (Visible) — Users see but can't join</option>
                  <option value="private_hidden">👁️‍🗨️ Private (Hidden) — Only members see it</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-body font-medium">Chat Mode</Label>
                <select
                  value={selectedGroup.chat_mode}
                  onChange={e => updateGroup('chat_mode', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
                >
                  <option value="open">💬 Open — Everyone can chat</option>
                  <option value="broadcast">📢 Broadcast — Admin only messages</option>
                </select>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="rounded-xl bg-card border border-border p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" /> Members ({members.length})
              </h3>
              <Button size="sm" variant="gold" onClick={() => setAddingUser(!addingUser)} className="font-body">
                <UserPlus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </div>

            {addingUser && (
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="font-body" />
                <div className="max-h-48 overflow-auto space-y-1">
                  {nonMembers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => addMember(u.id)}
                      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-body hover:bg-background transition-colors"
                    >
                      <span className="text-foreground">{u.full_name}</span>
                      <Plus className="h-4 w-4 text-accent" />
                    </button>
                  ))}
                  {nonMembers.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-2">No users to add</p>}
                </div>
              </div>
            )}

            <div className="space-y-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                  <span className="font-body text-sm text-foreground">{(m as any).profiles?.full_name || 'Unknown'}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)} className="text-destructive h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {members.length === 0 && <p className="text-muted-foreground font-body text-sm text-center py-4">No members yet</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Create group */}
          <div className="rounded-xl bg-card border border-border p-5 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Create Group</h2>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Group name..." className="font-body" />
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={2} className="font-body" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm font-medium">Visibility</Label>
                <select value={visibility} onChange={e => setVisibility(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                  <option value="public">🌐 Public</option>
                  <option value="private_visible">🔒 Private (Visible)</option>
                  <option value="private_hidden">👁️‍🗨️ Private (Hidden)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm font-medium">Chat Mode</Label>
                <select value={chatMode} onChange={e => setChatMode(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                  <option value="open">💬 Open Chat</option>
                  <option value="broadcast">📢 Broadcast (Admin only)</option>
                </select>
              </div>
            </div>

            <Button variant="gold" onClick={create} disabled={creating || !name.trim()} className="font-body">
              <Plus className="h-4 w-4 mr-2" /> Create Group
            </Button>
          </div>

          {/* Groups list */}
          <div className="space-y-3">
            {groups.map(g => (
              <button key={g.id} onClick={() => openGroup(g)} className="w-full rounded-lg bg-card border border-border p-4 flex items-center justify-between hover:border-accent/50 transition-all text-left">
                <div className="flex items-center gap-3">
                  {visibilityIcon(g.visibility)}
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{g.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-body">{visibilityLabel(g.visibility)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                        {g.chat_mode === 'broadcast' ? <><Megaphone className="h-3 w-3" /> Broadcast</> : <><MessageSquare className="h-3 w-3" /> Open Chat</>}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {groups.length === 0 && <p className="text-muted-foreground font-body text-center py-8">No groups yet. Create your first one above!</p>}
          </div>
        </>
      )}
    </div>
  );
}
