import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';

interface Testimony {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function TestimoniesPage() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [myTestimonies, setMyTestimonies] = useState<Testimony[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'browse' | 'mine' | 'submit'>('browse');

  useEffect(() => { fetchTestimonies(); }, []);

  const fetchTestimonies = async () => {
    const { data: approved } = await supabase
      .from('testimonies')
      .select('*, profiles(full_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (approved) setTestimonies(approved as any);

    if (user) {
      const { data: mine } = await supabase
        .from('testimonies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (mine) setMyTestimonies(mine);
    }
    setLoading(false);
  };

  const submitTestimony = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('testimonies').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });
    if (error) toast.error('Failed to submit testimony');
    else {
      toast.success('Testimony submitted for review!');
      setTitle(''); setContent('');
      fetchTestimonies();
      setTab('mine');
    }
    setSubmitting(false);
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { pending: 'bg-accent/10 text-accent', approved: 'bg-green-500/10 text-green-600', rejected: 'bg-destructive/10 text-destructive' };
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium font-body ${colors[s] || ''}`}>{s}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Testimony Room</h1>
        <p className="text-muted-foreground font-body mt-1">Share how God has moved in your life</p>
      </div>

      <div className="flex gap-2">
        {(['browse', 'mine', 'submit'] as const).map(t => (
          <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)} className="font-body capitalize">{t === 'mine' ? 'My Testimonies' : t}</Button>
        ))}
      </div>

      {tab === 'submit' && (
        <div className="rounded-xl bg-card border border-border p-5 shadow-soft space-y-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Testimony title..." className="font-body" />
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your testimony..." rows={5} className="font-body" />
          <Button variant="gold" onClick={submitTestimony} disabled={submitting || !title.trim() || !content.trim()}>
            <Send className="h-4 w-4 mr-2" />{submitting ? 'Submitting...' : 'Submit Testimony'}
          </Button>
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-4">
          {myTestimonies.length === 0 ? (
            <p className="text-muted-foreground font-body text-center py-8">You haven't submitted any testimonies yet.</p>
          ) : myTestimonies.map(t => (
            <div key={t.id} className="rounded-lg bg-card border border-border p-5 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading text-lg font-semibold text-foreground">{t.title}</h3>
                {statusBadge(t.status)}
              </div>
              <p className="font-body text-muted-foreground line-clamp-3">{t.content}</p>
              <p className="text-xs text-muted-foreground font-body mt-2">{new Date(t.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'browse' && (
        loading ? <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div> :
        testimonies.length === 0 ? (
          <div className="rounded-lg bg-card border border-border p-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-body">No testimonies yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonies.map(t => (
              <div key={t.id} className="rounded-lg bg-card border border-border p-5 shadow-soft">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{t.title}</h3>
                <p className="font-body text-foreground leading-relaxed">{t.content}</p>
                <p className="text-sm text-muted-foreground font-body mt-3">
                  {(t as any).profiles?.full_name || 'Anonymous'} · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
