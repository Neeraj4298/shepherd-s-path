import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';

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
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Chat Rooms</h1>
        <p className="text-muted-foreground font-body mt-1">Fellowship with other believers in real-time</p>
      </div>

      {!selectedRoom ? (
        rooms.length === 0 ? (
          <div className="rounded-lg bg-card border border-border p-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-body">No chat rooms available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => (
              <button key={room.id} onClick={() => setSelectedRoom(room)} className="rounded-lg bg-card border border-border p-5 shadow-soft text-left hover:border-accent/50 hover:shadow-card transition-all">
                <h3 className="font-heading text-lg font-semibold text-foreground">{room.name}</h3>
                <p className="text-sm text-accent font-body font-medium mt-1 capitalize">{room.type} chat</p>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <button onClick={() => setSelectedRoom(null)} className="text-sm text-accent hover:underline font-body">← Back</button>
            <h2 className="font-heading text-lg font-semibold text-foreground">{selectedRoom.name}</h2>
          </div>

          <div className="flex-1 overflow-auto py-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-muted-foreground font-body mb-1">
                  {(msg as any).profiles?.full_name || 'Unknown'}
                </span>
                <div className={`max-w-[75%] rounded-lg px-4 py-2 font-body text-sm ${
                  msg.user_id === user?.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground font-body mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="font-body"
            />
            <Button variant="gold" onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
