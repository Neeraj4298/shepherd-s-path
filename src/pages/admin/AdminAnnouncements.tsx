import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Announcement { id: string; title: string; content: string; created_at: string; }

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  useEffect(() => { fetch(); }, []);

  const create = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setCreating(true);
    await supabase.from('announcements').insert({ title: title.trim(), content: content.trim(), admin_id: user.id });
    toast.success('Announcement published'); setTitle(''); setContent(''); fetch();
    setCreating(false);
  };

  const remove = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('Announcement deleted'); fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Announcements</h1>

      <div className="rounded-lg bg-card border border-border p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Create Announcement</h2>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..." className="font-body" />
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content..." rows={3} className="font-body" />
        <Button variant="gold" onClick={create} disabled={creating || !title.trim() || !content.trim()} className="font-body">
          <Plus className="h-4 w-4 mr-2" /> Publish
        </Button>
      </div>

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="rounded-lg bg-card border border-border p-4 flex justify-between items-start">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{a.title}</h3>
              <p className="text-sm text-muted-foreground font-body mt-1">{a.content}</p>
              <p className="text-xs text-muted-foreground font-body mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(a.id)} className="text-destructive shrink-0 ml-4"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
