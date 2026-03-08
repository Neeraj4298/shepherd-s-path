import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Pin } from 'lucide-react';

interface Room { id: string; name: string; type: string; }
interface Msg { id: string; content: string; is_pinned: boolean; created_at: string; profiles?: { full_name: string } | null; }

export default function AdminChat() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);

  useEffect(() => {
    supabase.from('chat_rooms').select('*').order('created_at').then(({ data }) => { if (data) setRooms(data); });
  }, []);

  const loadMessages = async (room: Room) => {
    setSelectedRoom(room);
    const { data } = await supabase.from('chat_messages').select('*, profiles(full_name)').eq('room_id', room.id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(50);
    if (data) setMessages(data as any);
  };

  const deleteMsg = async (id: string) => {
    await supabase.from('chat_messages').update({ is_deleted: true }).eq('id', id);
    toast.success('Message deleted'); if (selectedRoom) loadMessages(selectedRoom);
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from('chat_messages').update({ is_pinned: !pinned }).eq('id', id);
    toast.success(pinned ? 'Unpinned' : 'Pinned'); if (selectedRoom) loadMessages(selectedRoom);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Chat Moderation</h1>

      {!selectedRoom ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rooms.map(r => (
            <button key={r.id} onClick={() => loadMessages(r)} className="rounded-lg bg-card border border-border p-4 text-left hover:border-accent/50 transition-all">
              <h3 className="font-heading font-semibold text-foreground">{r.name}</h3>
              <p className="text-sm text-muted-foreground font-body capitalize">{r.type}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setSelectedRoom(null)} className="text-sm text-accent hover:underline font-body">← Back</button>
          <h2 className="font-heading text-xl font-semibold text-foreground">{selectedRoom.name}</h2>
          {messages.map(m => (
            <div key={m.id} className={`rounded-lg bg-card border p-3 ${m.is_pinned ? 'border-accent' : 'border-border'}`}>
              <p className="font-body text-sm text-foreground">{m.content}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{(m as any).profiles?.full_name} · {new Date(m.created_at).toLocaleString()}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => togglePin(m.id, m.is_pinned)} className="text-xs font-body"><Pin className="h-3 w-3 mr-1" />{m.is_pinned ? 'Unpin' : 'Pin'}</Button>
                <Button size="sm" variant="outline" onClick={() => deleteMsg(m.id)} className="text-xs font-body text-destructive"><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-muted-foreground font-body">No messages.</p>}
        </div>
      )}
    </div>
  );
}
