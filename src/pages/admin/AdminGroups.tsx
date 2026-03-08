import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Lock, Eye, EyeOff, Megaphone, MessageSquare, UserPlus, Check, X } from 'lucide-react';

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

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | null;
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
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');

  const fetchGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (data) setGroups(data);
  };

  const fetchMembers = async (groupId: string) => {
    const { data } = await supabase.from('group_members').select('id, user_id, profiles(full_name)').eq('group_id', groupId);
    if (data) setMembers(data as any);
  };

  const fetchJoinRequests = async (groupId: string) => {
    const { data } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) {
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setJoinRequests(data.map(r => ({ ...r, profiles: profileMap.get(r.user_id) || null })) as JoinRequest[]);
    }
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

    if (group) {
      await supabase.from('chat_rooms').insert({ name: `${name.trim()} Chat`, type: 'group' as const, group_id: group.id });
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
    setActiveTab('members');
    fetchMembers(g.id);
    fetchJoinRequests(g.id);
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

  const approveRequest = async (request: JoinRequest) => {
    if (!selectedGroup) return;
    // Add to group_members
    await supabase.from('group_members').insert({ group_id: selectedGroup.id, user_id: request.user_id });
    // Update request status
    await supabase.from('group_join_requests').update({ status: 'approved' }).eq('id', request.id);
    toast.success('Request approved & member added');
    fetchMembers(selectedGroup.id);
    fetchJoinRequests(selectedGroup.id);
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from('group_join_requests').update({ status: 'rejected' }).eq('id', requestId);
    toast.success('Request rejected');
    if (selectedGroup) fetchJoinRequests(selectedGroup.id);
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
  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body font-medium">Visibility</Label>
                <select value={selectedGroup.visibility} onChange={e => updateGroup('visibility', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                  <option value="public">🌐 Public — Anyone can see & join</option>
                  <option value="private_visible">🔒 Private (Visible) — Users see but must request</option>
                  <option value="private_hidden">👁️‍🗨️ Private (Hidden) — Only members see it</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-body font-medium">Chat Mode</Label>
                <select value={selectedGroup.chat_mode} onChange={e => updateGroup('chat_mode', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                  <option value="open">💬 Open — Everyone can chat</option>
                  <option value="broadcast">📢 Broadcast — Admin only messages</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button size="sm" variant={activeTab === 'members' ? 'default' : 'outline'} onClick={() => setActiveTab('members')} className="font-body">
              <Users className="h-4 w-4 mr-1" /> Members ({members.length})
            </Button>
            <Button size="sm" variant={activeTab === 'requests' ? 'default' : 'outline'} onClick={() => setActiveTab('requests')} className="font-body">
              Join Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
          </div>

          {activeTab === 'members' ? (
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
                      <button key={u.id} onClick={() => addMember(u.id)} className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-body hover:bg-background transition-colors">
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
          ) : (
            <div className="rounded-xl bg-card border border-border p-5 shadow-soft space-y-4">
              <h3 className="font-heading text-lg font-semibold text-foreground">Join Requests</h3>

              {pendingRequests.length > 0 ? (
                <div className="space-y-2">
                  {pendingRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-accent/5 border border-accent/20">
                      <div>
                        <span className="font-body text-sm text-foreground">{r.profiles?.full_name || 'Unknown'}</span>
                        <p className="text-xs text-muted-foreground font-body">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="gold" onClick={() => approveRequest(r)} className="h-8 px-3 font-body">
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectRequest(r.id)} className="h-8 px-3 text-destructive font-body">
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-body text-sm text-center py-4">No pending join requests</p>
              )}

              {joinRequests.filter(r => r.status !== 'pending').length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wide">History</p>
                  {joinRequests.filter(r => r.status !== 'pending').map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-md px-3 py-1.5">
                      <span className="font-body text-sm text-foreground">{r.profiles?.full_name || 'Unknown'}</span>
                      <span className={`text-xs font-body px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
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
