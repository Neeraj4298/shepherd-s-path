import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, MessageSquare, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
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

export default function ChatRoomsPage() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Admin create state
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'general' | 'prayer'>('general');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    fetchMessages(selectedRoom.id);

    const channel = supabase
      .channel(`room-${selectedRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${selectedRoom.id}` },
        async (payload) => {
          const { data } = await supabase.from('chat_messages').select('*, profiles(full_name)').eq('id', payload.new.id).single();
          if (data) setMessages(prev => [...prev, data as any]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('chat_rooms').select('*').order('created_at');
    if (data) setRooms(data);
    setLoading(false);
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('chat_rooms').insert({
      name: newRoomName.trim(),
      type: newRoomType,
    });
    if (error) { toast.error('Failed to create room'); setCreating(false); return; }
    toast.success('Chat room created!');
    setNewRoomName(''); setNewRoomType('general'); setShowCreate(false);
    fetchRooms();
    setCreating(false);
  };

  const deleteRoom = async (roomId: string) => {
    await supabase.from('chat_rooms').delete().eq('id', roomId);
    toast.success('Room deleted');
    setSelectedRoom(null);
    fetchRooms();
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedRoom) return;
    await supabase.from('chat_messages').insert({
      room_id: selectedRoom.id,
      user_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedRoom ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Chat Rooms</h1>
              <p className="text-muted-foreground font-body mt-1">Fellowship with other believers in real-time</p>
            </div>
            {isAdmin && (
              <Button variant="gold" onClick={() => setShowCreate(!showCreate)} className="font-body">
                <Plus className="h-4 w-4 mr-2" /> Create Room
              </Button>
            )}
          </div>

          {/* Admin create form */}
          {isAdmin && showCreate && (
            <div className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-soft">
              <h2 className="font-heading text-lg font-semibold text-foreground">New Chat Room</h2>
              <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Room name..." className="font-body" />
              <div className="space-y-2">
                <Label className="font-body text-sm font-medium">Room Type</Label>
                <select value={newRoomType} onChange={e => setNewRoomType(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body">
                  <option value="general">💬 General</option>
                  <option value="prayer">🙏 Prayer</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="gold" onClick={createRoom} disabled={creating || !newRoomName.trim()} className="font-body">
                  <Plus className="h-4 w-4 mr-2" /> Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} className="font-body">Cancel</Button>
              </div>
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="rounded-lg bg-card border border-border p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-body">No chat rooms available yet.{isAdmin ? ' Create your first one above!' : ''}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="rounded-xl bg-card border border-border p-5 shadow-soft hover:border-accent/50 hover:shadow-card transition-all">
                  <div className="flex items-start justify-between">
                    <button onClick={() => setSelectedRoom(room)} className="text-left flex-1">
                      <h3 className="font-heading text-lg font-semibold text-foreground">{room.name}</h3>
                      <p className="text-sm text-accent font-body font-medium mt-1 capitalize">{room.type} chat</p>
                    </button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => deleteRoom(room.id)} className="text-destructive h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button variant="gold" size="sm" onClick={() => setSelectedRoom(room)} className="font-body mt-3 w-full">
                    Open Chat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <button onClick={() => setSelectedRoom(null)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-lg font-semibold text-foreground flex-1">{selectedRoom.name}</h2>
            <span className="text-xs text-accent font-body font-medium capitalize bg-accent/10 px-2 py-0.5 rounded-full">{selectedRoom.type}</span>
          </div>

          <div className="flex-1 overflow-auto py-4 space-y-2 px-1">
            {messages.map(msg => {
              const isMe = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
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

          <div className="flex gap-2 pt-4 border-t border-border">
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
        </div>
      )}
    </div>
  );
}
