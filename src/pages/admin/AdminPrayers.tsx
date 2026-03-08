import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Prayer {
  id: string;
  content: string;
  is_pinned: boolean;
  is_approved: boolean;
  prayer_count: number;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function AdminPrayers() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from('prayer_requests').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (data) setPrayers(data as any);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const approve = async (id: string) => {
    await supabase.from('prayer_requests').update({ is_approved: true }).eq('id', id);
    toast.success('Prayer approved'); fetch();
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from('prayer_requests').update({ is_pinned: !pinned }).eq('id', id);
    toast.success(pinned ? 'Unpinned' : 'Pinned'); fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('prayer_requests').delete().eq('id', id);
    toast.success('Deleted'); fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Prayer Moderation</h1>
      {loading ? <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div> :
      <div className="space-y-3">
        {prayers.map(p => (
          <div key={p.id} className={`rounded-lg bg-card border p-4 ${p.is_pinned ? 'border-accent' : 'border-border'}`}>
            <p className="font-body text-foreground text-sm">{p.content}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{(p as any).profiles?.full_name} · 🙏 {p.prayer_count}</p>
            <div className="flex gap-2 mt-3">
              {!p.is_approved && <Button size="sm" variant="default" onClick={() => approve(p.id)} className="font-body text-xs">Approve</Button>}
              <Button size="sm" variant="outline" onClick={() => togglePin(p.id, p.is_pinned)} className="font-body text-xs">{p.is_pinned ? 'Unpin' : 'Pin'}</Button>
              <Button size="sm" variant="outline" onClick={() => remove(p.id)} className="font-body text-xs text-destructive">Delete</Button>
            </div>
          </div>
        ))}
        {prayers.length === 0 && <p className="text-muted-foreground font-body">No prayer requests.</p>}
      </div>}
    </div>
  );
}
