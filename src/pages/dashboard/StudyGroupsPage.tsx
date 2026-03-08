import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, LogOut, Send, Lock, Eye, EyeOff, Megaphone, MessageSquare, ArrowLeft, Clock } from 'lucide-react';
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
  user_id: string;
  profiles: { full_name: string } | null;
}

export default function StudyGroupsPage() {
  const { user, role } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = role === 'admin';

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (!groupsData || !user) { setLoading(false); return; }

    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    const memberSet = new Set(memberships?.map(m => m.group_id) || []);

    // Fetch join requests for this user
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

    const { data: mems } = await supabase.from('group_members').select('user_id, profiles(full_name)').eq('group_id', group.id);
    if (mems) setMembers(mems as any);
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

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

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
            {selectedGroup.is_member && (
              <Button size="sm" variant="outline" onClick={() => leaveGroup(selectedGroup.id)} className="font-body text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {activeTab === 'members' ? (
          <div className="flex-1 overflow-auto py-4 space-y-1">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent font-body">
                  {((m as any).profiles?.full_name || '?')[0].toUpperCase()}
                </div>
                <span className="font-body text-sm text-foreground">{(m as any).profiles?.full_name || 'Unknown'}</span>
              </div>
            ))}
          </div>
        ) : (
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Study Groups</h1>
        <p className="text-muted-foreground font-body mt-1">Join a group and grow together in fellowship</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-body">No study groups available yet. Ask your admin to create one!</p>
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
                {g.is_member ? (
                  <>
                    <Button variant="gold" size="sm" onClick={() => openGroup(g)} className="font-body flex-1">
                      Open Group
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => leaveGroup(g.id)} className="font-body">
                      <LogOut className="h-4 w-4" />
                    </Button>
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
