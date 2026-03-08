import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface PrayerRequest {
  id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  prayer_count: number;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function PrayerRoom() {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPrayers(); }, []);

  const fetchPrayers = async () => {
    const { data } = await supabase
      .from('prayer_requests')
      .select('*, profiles(full_name)')
      .eq('is_approved', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setPrayers(data as any);
    setLoading(false);
  };

  const submitPrayer = async () => {
    if (!newPrayer.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('prayer_requests').insert({
      user_id: user.id,
      content: newPrayer.trim(),
    });
    if (error) {
      toast.error('Failed to submit prayer request');
    } else {
      toast.success('Prayer request submitted! It will appear once approved.');
      setNewPrayer('');
    }
    setSubmitting(false);
  };

  const prayForRequest = async (prayer: PrayerRequest) => {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ prayer_count: prayer.prayer_count + 1 })
      .eq('id', prayer.id);
    if (!error) {
      setPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, prayer_count: p.prayer_count + 1 } : p));
      toast.success('🙏 Praying for them!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Prayer Room</h1>
        <p className="text-muted-foreground font-body mt-1">Share your prayer requests and uplift others</p>
      </div>

      {/* Submit prayer */}
      <div className="rounded-xl bg-card border border-border p-5 shadow-soft">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Submit a Prayer Request</h2>
        <Textarea
          value={newPrayer}
          onChange={(e) => setNewPrayer(e.target.value)}
          placeholder="Share what's on your heart..."
          className="font-body mb-3"
          rows={3}
        />
        <Button variant="gold" onClick={submitPrayer} disabled={submitting || !newPrayer.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {submitting ? 'Submitting...' : 'Submit Prayer'}
        </Button>
      </div>

      {/* Prayer list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      ) : prayers.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-body">No prayer requests yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prayers.map(prayer => (
            <div key={prayer.id} className={`rounded-lg bg-card border p-5 shadow-soft ${prayer.is_pinned ? 'border-accent' : 'border-border'}`}>
              {prayer.is_pinned && <span className="text-xs font-body font-medium text-accent mb-2 block">📌 Pinned</span>}
              <p className="font-body text-foreground leading-relaxed">{prayer.content}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground font-body">
                  <span className="font-medium">{(prayer as any).profiles?.full_name || 'Anonymous'}</span>
                  {' · '}
                  {new Date(prayer.created_at).toLocaleDateString()}
                </div>
                <Button variant="ghost" size="sm" onClick={() => prayForRequest(prayer)} className="font-body">
                  🙏 Praying ({prayer.prayer_count})
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
