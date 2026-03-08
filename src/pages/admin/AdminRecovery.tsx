import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Category { id: string; name: string; icon: string | null; }

export default function AdminRecovery() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const fetch = async () => {
    const { data } = await supabase.from('addiction_categories').select('*').order('name');
    if (data) setCategories(data);
  };

  useEffect(() => { fetch(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await supabase.from('addiction_categories').insert({ name: name.trim(), icon: icon.trim() || null });
    toast.success('Category added'); setName(''); setIcon(''); fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('addiction_categories').delete().eq('id', id);
    toast.success('Category removed'); fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Recovery Content Management</h1>

      <div className="rounded-lg bg-card border border-border p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Add Category</h2>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Category name..." className="font-body" />
        <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="Icon name (lucide)..." className="font-body" />
        <Button variant="gold" onClick={add} className="font-body"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="rounded-lg bg-card border border-border p-3 flex justify-between items-center">
            <span className="font-body text-foreground">{c.name}</span>
            <Button size="sm" variant="outline" onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
