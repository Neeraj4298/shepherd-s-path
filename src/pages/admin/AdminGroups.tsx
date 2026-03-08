import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function AdminGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (data) setGroups(data);
  };

  useEffect(() => { fetch(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await supabase.from('study_groups').insert({ name: name.trim(), description: description.trim() || null, created_by: user?.id });
    toast.success('Group created'); setName(''); setDescription(''); fetch();
    setCreating(false);
  };

  const remove = async (id: string) => {
    await supabase.from('study_groups').delete().eq('id', id);
    toast.success('Group deleted'); fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Group Management</h1>

      <div className="rounded-lg bg-card border border-border p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Create Group</h2>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Group name..." className="font-body" />
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={2} className="font-body" />
        <Button variant="gold" onClick={create} disabled={creating || !name.trim()} className="font-body">
          <Plus className="h-4 w-4 mr-2" /> Create Group
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="rounded-lg bg-card border border-border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{g.name}</h3>
              {g.description && <p className="text-sm text-muted-foreground font-body">{g.description}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(g.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
