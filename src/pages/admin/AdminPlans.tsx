import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Plan { id: string; title: string; description: string | null; duration_days: number; type: string; }

export default function AdminPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState('30');
  const [creating, setCreating] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('study_plans').select('*').order('created_at', { ascending: false });
    if (data) setPlans(data);
  };

  useEffect(() => { fetch(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    await supabase.from('study_plans').insert({ title: title.trim(), description: desc.trim() || null, duration_days: parseInt(days) || 30, created_by: user?.id, type: 'global' as const });
    toast.success('Plan created'); setTitle(''); setDesc(''); setDays('30'); fetch();
    setCreating(false);
  };

  const remove = async (id: string) => {
    await supabase.from('study_plans').delete().eq('id', id);
    toast.success('Plan deleted'); fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Study Plan Management</h1>

      <div className="rounded-lg bg-card border border-border p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Create Plan</h2>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Plan title..." className="font-body" />
        <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description..." rows={2} className="font-body" />
        <Input value={days} onChange={e => setDays(e.target.value)} type="number" placeholder="Duration (days)" className="font-body w-40" />
        <Button variant="gold" onClick={create} disabled={creating || !title.trim()} className="font-body">
          <Plus className="h-4 w-4 mr-2" /> Create Plan
        </Button>
      </div>

      <div className="space-y-3">
        {plans.map(p => (
          <div key={p.id} className="rounded-lg bg-card border border-border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{p.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{p.duration_days} days · {p.type}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
