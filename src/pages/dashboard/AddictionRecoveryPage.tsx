import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldCheck, Plus, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Guidance {
  id: string;
  addiction_id: string;
  scripture: string | null;
  steps: string | null;
  prayer_text: string | null;
}

export default function AddictionRecoveryPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [userAddictions, setUserAddictions] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: cats } = await supabase.from('addiction_categories').select('*').order('name');
    if (cats) setCategories(cats);

    if (user) {
      const { data: ua } = await supabase.from('user_addictions').select('addiction_id').eq('user_id', user.id);
      if (ua) setUserAddictions(new Set(ua.map(a => a.addiction_id)));
    }
    setLoading(false);
  };

  const toggleAddiction = async (catId: string) => {
    if (!user) return;
    if (userAddictions.has(catId)) {
      await supabase.from('user_addictions').delete().eq('user_id', user.id).eq('addiction_id', catId);
      const newSet = new Set(userAddictions);
      newSet.delete(catId);
      setUserAddictions(newSet);
      toast.success('Removed from your recovery list');
    } else {
      await supabase.from('user_addictions').insert({ user_id: user.id, addiction_id: catId });
      setUserAddictions(new Set([...userAddictions, catId]));
      toast.success('Added to your recovery list');
    }
  };

  const viewGuidance = async (cat: Category) => {
    setSelectedCategory(cat);
    const { data } = await supabase.from('addiction_guidance').select('*').eq('addiction_id', cat.id).limit(1).single();
    if (data) setGuidance(data);
    else setGuidance(null);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Addiction Recovery</h1>
        <p className="text-muted-foreground font-body mt-1">Find freedom through faith and community</p>
      </div>

      {selectedCategory && guidance ? (
        <div className="space-y-4">
          <button onClick={() => { setSelectedCategory(null); setGuidance(null); }} className="text-sm text-accent hover:underline font-body">← Back</button>
          <div className="rounded-xl bg-card border border-border p-6 shadow-soft space-y-5">
            <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedCategory.name}</h2>

            {guidance.scripture && (
              <div className="rounded-lg bg-gradient-navy p-4">
                <p className="font-heading text-base italic text-primary-foreground">{guidance.scripture}</p>
              </div>
            )}

            {guidance.steps && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Recovery Steps</h3>
                <div className="space-y-2">
                  {guidance.steps.split('\n').map((step, i) => (
                    <p key={i} className="font-body text-foreground text-sm">{step}</p>
                  ))}
                </div>
              </div>
            )}

            {guidance.prayer_text && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Prayer</h3>
                <p className="font-body text-muted-foreground italic">{guidance.prayer_text}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {userAddictions.size > 0 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-3">Your Recovery Journey</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.filter(c => userAddictions.has(c.id)).map(cat => (
                  <div key={cat.id} className="rounded-lg bg-card border border-accent p-4 shadow-soft flex items-center justify-between">
                    <button onClick={() => viewGuidance(cat)} className="font-body font-medium text-foreground hover:text-accent text-left">
                      {cat.name}
                    </button>
                    <button onClick={() => toggleAddiction(cat.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
              {userAddictions.size > 0 ? 'Add More Areas' : 'Select Your Struggles'}
            </h2>
            <p className="text-muted-foreground font-body text-sm mb-4">This is confidential. Only you can see your selections.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.filter(c => !userAddictions.has(c.id)).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleAddiction(cat.id)}
                  className="rounded-lg bg-card border border-border p-4 text-center hover:border-accent/50 hover:shadow-soft transition-all"
                >
                  <p className="font-body font-medium text-foreground text-sm">{cat.name}</p>
                  <Plus className="h-4 w-4 text-muted-foreground mx-auto mt-2" />
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-3">Browse All Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => viewGuidance(cat)} className="rounded-lg bg-card border border-border p-4 text-left hover:border-accent/50 hover:shadow-soft transition-all">
                    <p className="font-body font-medium text-foreground">{cat.name}</p>
                    <p className="text-xs text-accent font-body mt-1">View guidance →</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
