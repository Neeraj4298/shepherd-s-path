import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, LogOut, Send, Lock, Eye, EyeOff, Megaphone, MessageSquare, ArrowLeft, Clock, Plus, Check, X, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  chat_mode: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  join_status?: string | null;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface Member {
  id: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

interface JoinRequest {
  id: string;
  user_id: string;
  group_id: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function StudyGroupsPage() {
  const { user, role } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'requests' | 'settings'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = role === 'admin';

  // Admin create group state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private_visible' | 'private_hidden'>('public');
  const [newChatMode, setNewChatMode] = useState<'open' | 'broadcast'>('open');
  const [creating, setCreating] = useState(false);

  // Admin join requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (!groupsData || !user) { setLoading(false); return; }

    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    const memberSet = new Set(memberships?.map(m => m.group_id) || []);

    const { data: requests } = await supabase.from('group_join_requests').select('group_id, status').eq('user_id', user.id);
    const requestMap = new Map(requests?.map(r => [r.group_id, r.status]) || []);

    const enriched = await Promise.all(groupsData.map(async g => {
      const { count } = await supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', g.id);
      return {
        ...g,
        member_count: count || 0,
        is_member: memberSet.has(g.id),
        join_status: requestMap.get(g.id) || null,
      };
    }));

    setGroups(enriched);
    setLoading(false);
  };

  const createGroup = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { data: group, error } = await supabase.from('study_groups').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      created_by: user.id,
      visibility: newVisibility,
      chat_mode: newChatMode,
    }).select().single();

    if (error) { toast.error('Failed to create group'); setCreating(false); return; }

    if (group) {
      await supabase.from('chat_rooms').insert({ name: `${newName.trim()} Chat`, type: 'group' as const, group_id: group.id });
      // Auto-add admin as member
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
    }

    toast.success('Group created!');
    setNewName(''); setNewDesc(''); setNewVisibility('public'); setNewChatMode('open'); setShowCreate(false);
    fetchGroups();
    setCreating(false);
  };

  const deleteGroup = async (groupId: string) => {
    await supabase.from('study_groups').delete().eq('id', groupId);
    toast.success('Group deleted');
    setSelectedGroup(null);
    fetchGroups();
  };

  const fetchJoinRequests = async (groupId: string) => {
    const { data } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) {
      const userIds = data.map(r => r.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setJoinRequests(data.map(r => ({ ...r, profiles: profileMap.get(r.user_id) || null })));
      } else {
        setJoinRequests([]);
      }
    }
  };

  const approveRequest = async (request: JoinRequest) => {
    if (!selectedGroup) return;
    await supabase.from('group_members').insert({ group_id: selectedGroup.id, user_id: request.user_id });
    await supabase.from('group_join_requests').update({ status: 'approved' }).eq('id', request.id);
    toast.success('Request approved');
    fetchJoinRequests(selectedGroup.id);
    fetchMembers(selectedGroup.id);
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
    setSelectedGroup({ ...selectedGroup, [field]: value });
    fetchGroups();
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
    if (error) toast.error('Failed to join group');
    else { toast.success('Joined group!'); fetchGroups(); }
  };

  const requestToJoin = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_join_requests').insert({ group_id: groupId, user_id: user.id });
    if (error) toast.error('Already requested or error');
    else { toast.success('Join request sent! Waiting for admin approval.'); fetchGroups(); }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    if (error) toast.error('Failed to leave group');
    else { toast.success('Left group'); setSelectedGroup(null); fetchGroups(); }
  };

  const fetchMembers = async (groupId: string) => {
    const { data: mems } = await supabase.from('group_members').select('id, user_id, profiles(full_name)').eq('group_id', groupId);
    if (mems) setMembers(mems as any);
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('group_members').delete().eq('id', memberId);
    toast.success('Member removed');
    if (selectedGroup) fetchMembers(selectedGroup.id);
  };

  const openGroup = async (group: StudyGroup) => {
    setSelectedGroup(group);
    setActiveTab('chat');

    const { data: room } = await supabase.from('chat_rooms').select('id').eq('group_id', group.id).single();
    if (room) {
      setChatRoomId(room.id);
      fetchMessages(room.id);
      subscribeToMessages(room.id);
    } else {
      setChatRoomId(null);
      setMessages([]);
    }

    fetchMembers(group.id);
    if (isAdmin) fetchJoinRequests(group.id);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles(full_name)')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data as any);
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = supabase
      .channel(`group-chat-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data } = await supabase.from('chat_messages').select('*, profiles(full_name)').eq('id', payload.new.id).single();
          if (data) setMessages(prev => [...prev, data as any]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatRoomId) return;
    await supabase.from('chat_messages').insert({ room_id: chatRoomId, user_id: user.id, content: newMessage.trim() });
    setNewMessage('');
  };

  const canSendMessage = () => {
    if (!selectedGroup) return false;
    if (selectedGroup.chat_mode === 'broadcast' && !isAdmin) return false;
    return true;
  };

  const visibilityBadge = (v: string) => {
    if (v === 'public') return <span className="inline-flex items-center gap-1 text-xs font-body text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full"><Eye className="h-3 w-3" />Public</span>;
    if (v === 'private_visible') return <span className="inline-flex items-center gap-1 text-xs font-body text-accent bg-accent/10 px-2 py-0.5 rounded-full"><Lock className="h-3 w-3" />Private</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><EyeOff className="h-3 w-3" />Hidden</span>;
  };

  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  // ──── Selected group view ────
  if (selectedGroup) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <button onClick={() => setSelectedGroup(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">{selectedGroup.name}</h2>
              {visibilityBadge(selectedGroup.visibility)}
              {selectedGroup.chat_mode === 'broadcast' && (
                <span className="inline-flex items-center gap-1 text-xs font-body text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  <Megaphone className="h-3 w-3" />Broadcast
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-body">{members.length} members</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={activeTab === 'chat' ? 'default' : 'outline'} onClick={() => setActiveTab('chat')} className="font-body">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button size="sm" variant={activeTab === 'members' ? 'default' : 'outline'} onClick={() => setActiveTab('members')} className="font-body">
              <Users className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <>
                <Button size="sm" variant={activeTab === 'requests' ? 'default' : 'outline'} onClick={() => setActiveTab('requests')} className="font-body relative">
                  <UserPlus className="h-4 w-4" />
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  )}
                </Button>
                <Button size="sm" variant={activeTab === 'settings' ? 'default' : 'outline'} onClick={() => setActiveTab('settings')} className="font-body">
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
            {selectedGroup.is_member && (
              <Button size="sm" variant="outline" onClick={() => leaveGroup(selectedGroup.id)} className="font-body text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Members tab ── */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-auto py-4 space-y-1">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent font-body">
                    {(m.profiles?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <span className="font-body text-sm text-foreground">{m.profiles?.full_name || 'Unknown'}</span>
                </div>
                {isAdmin && m.user_id !== user?.id && (
                  <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)} className="text-destructive h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Join Requests tab (admin only) ── */}
        {activeTab === 'requests' && isAdmin && (
          <div className="flex-1 overflow-auto py-4 space-y-3">
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

        {/* ── Settings tab (admin only) ── */}
        {activeTab === 'settings' && isAdmin && (
          <div className="flex-1 overflow-auto py-4 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Group Settings</h3>
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
            <div className="pt-4 border-t border-border">
              <Button variant="outline" onClick={() => deleteGroup(selectedGroup.id)} className="text-destructive font-body">
                <Trash2 className="h-4 w-4 mr-1" /> Delete Group
              </Button>
            </div>
          </div>
        )}

        {/* ── Chat tab ── */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-auto py-4 space-y-2 px-1">
              {selectedGroup.chat_mode === 'broadcast' && !isAdmin && (
                <div className="text-center py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <Megaphone className="h-3 w-3" /> Only admins can send messages in this channel
                  </span>
                </div>
              )}
              {!chatRoomId && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-body text-sm">No chat room configured for this group.</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-accent text-accent-foreground rounded-br-md'
                        : 'bg-card border border-border text-foreground rounded-bl-md'
                    }`}>
                      {!isMe && (
                        <p className="text-xs font-semibold font-body mb-0.5 text-accent">
                          {(msg as any).profiles?.full_name || 'Unknown'}
                        </p>
                      )}
                      <p className="font-body text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-accent-foreground/50' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {canSendMessage() && chatRoomId && (
              <div className="flex gap-2 pt-3 border-t border-border">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="font-body rounded-full"
                />
                <Button variant="gold" onClick={sendMessage} disabled={!newMessage.trim()} className="rounded-full" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ──── Group list view ────
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Study Groups</h1>
          <p className="text-muted-foreground font-body mt-1">Join a group and grow together in fellowship</p>
        </div>
        {isAdmin && (
          <Button variant="gold" onClick={() => setShowCreate(!showCreate)} className="font-body">
            <Plus className="h-4 w-4 mr-2" /> Create Group
          </Button>
        )}
      </div>

      {/* Admin create group form */}
      {isAdmin && showCreate && (
        <div className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-soft">
          <h2 className="font-heading text-lg font-semibold text-foreground">New Group</h2>
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Group name..." className="font-body" />
          <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." rows={2} className="font-body" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-sm font-medium">Visibility</Label>
              <select value={newVisibility} onChange={e => setNewVisibility(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                <option value="public">🌐 Public</option>
                <option value="private_visible">🔒 Private (Visible)</option>
                <option value="private_hidden">👁️‍🗨️ Private (Hidden)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm font-medium">Chat Mode</Label>
              <select value={newChatMode} onChange={e => setNewChatMode(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                <option value="open">💬 Open Chat</option>
                <option value="broadcast">📢 Broadcast (Admin only)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="gold" onClick={createGroup} disabled={creating || !newName.trim()} className="font-body">
              <Plus className="h-4 w-4 mr-2" /> Create
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-body">Cancel</Button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-body">No study groups available yet.{isAdmin ? ' Create your first one above!' : ' Ask your admin to create one!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(g => (
            <div key={g.id} className="rounded-xl bg-card border border-border p-5 shadow-soft hover:shadow-card transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading text-lg font-semibold text-foreground">{g.name}</h3>
                <div className="flex gap-1.5">
                  {visibilityBadge(g.visibility)}
                </div>
              </div>
              {g.description && <p className="font-body text-muted-foreground mt-1 text-sm">{g.description}</p>}

              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {g.member_count} members</span>
                <span className="flex items-center gap-1">
                  {g.chat_mode === 'broadcast' ? <><Megaphone className="h-3 w-3" /> Broadcast</> : <><MessageSquare className="h-3 w-3" /> Open Chat</>}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                {g.is_member || isAdmin ? (
                  <>
                    <Button variant="gold" size="sm" onClick={() => openGroup(g)} className="font-body flex-1">
                      Open Group
                    </Button>
                    {g.is_member && !isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => leaveGroup(g.id)} className="font-body">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                ) : g.visibility === 'public' ? (
                  <Button variant="gold" size="sm" onClick={() => joinGroup(g.id)} className="font-body flex-1">
                    <UserPlus className="h-4 w-4 mr-1" /> Join Group
                  </Button>
                ) : g.join_status === 'pending' ? (
                  <div className="flex items-center gap-2 text-sm text-amber-600 font-body">
                    <Clock className="h-4 w-4" /> Request pending...
                  </div>
                ) : g.join_status === 'rejected' ? (
                  <div className="flex items-center gap-2 text-sm text-destructive font-body">
                    Request declined
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => requestToJoin(g.id)} className="font-body flex-1">
                    <Lock className="h-4 w-4 mr-1" /> Request to Join
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