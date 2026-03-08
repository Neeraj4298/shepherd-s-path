import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Testimony {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function AdminTestimonies() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from('testimonies').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (data) setTestimonies(data as any);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('testimonies').update({ status }).eq('id', id);
    if (error) toast.error('Failed'); else { toast.success(`Testimony ${status}`); fetch(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Testimony Moderation</h1>
      {loading ? <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div> :
      testimonies.length === 0 ? <p className="text-muted-foreground font-body">No testimonies.</p> :
      <div className="space-y-4">
        {testimonies.map(t => (
          <div key={t.id} className="rounded-lg bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-lg font-semibold text-foreground">{t.title}</h3>
              <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${t.status === 'pending' ? 'bg-accent/10 text-accent' : t.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}`}>{t.status}</span>
            </div>
            <p className="font-body text-sm text-muted-foreground mb-2">by {(t as any).profiles?.full_name || 'Unknown'} · {new Date(t.created_at).toLocaleDateString()}</p>
            <p className="font-body text-foreground text-sm">{t.content}</p>
            {t.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default" onClick={() => updateStatus(t.id, 'approved')} className="font-body">Approve</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, 'rejected')} className="font-body text-destructive">Reject</Button>
              </div>
            )}
          </div>
        ))}
      </div>}
    </div>
  );
}
