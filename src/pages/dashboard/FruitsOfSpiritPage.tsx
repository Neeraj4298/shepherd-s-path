import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Apple } from 'lucide-react';

interface FruitExercise {
  id: string;
  fruit_name: string;
  description: string | null;
  exercise_text: string | null;
  scripture_ref: string | null;
}

interface FruitProgress {
  id: string;
  fruit_id: string;
  reflection: string | null;
  logged_at: string;
}

export default function FruitsOfSpiritPage() {
  const { user } = useAuth();
  const [fruits, setFruits] = useState<FruitExercise[]>([]);
  const [selectedFruit, setSelectedFruit] = useState<FruitExercise | null>(null);
  const [reflection, setReflection] = useState('');
  const [fruitLog, setFruitLog] = useState<FruitProgress[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('fruits_exercises').select('*').order('fruit_name').then(({ data }) => { if (data) setFruits(data); });
  }, []);

  const selectFruit = async (fruit: FruitExercise) => {
    setSelectedFruit(fruit);
    if (user) {
      const { data } = await supabase.from('user_fruit_progress').select('*').eq('user_id', user.id).eq('fruit_id', fruit.id).order('logged_at', { ascending: false }).limit(10);
      if (data) setFruitLog(data);
    }
  };

  const logReflection = async () => {
    if (!reflection.trim() || !user || !selectedFruit) return;
    setSubmitting(true);
    const { error } = await supabase.from('user_fruit_progress').insert({
      user_id: user.id,
      fruit_id: selectedFruit.id,
      reflection: reflection.trim(),
    });
    if (error) toast.error('Failed to log reflection');
    else {
      toast.success('Reflection logged! Keep growing 🌱');
      setReflection('');
      selectFruit(selectedFruit);
    }
    setSubmitting(false);
  };

  const fruitColors: Record<string, string> = {
    Love: 'border-red-400/50 hover:border-red-400',
    Joy: 'border-yellow-400/50 hover:border-yellow-400',
    Peace: 'border-blue-400/50 hover:border-blue-400',
    Patience: 'border-orange-400/50 hover:border-orange-400',
    Kindness: 'border-pink-400/50 hover:border-pink-400',
    Goodness: 'border-green-400/50 hover:border-green-400',
    Faithfulness: 'border-purple-400/50 hover:border-purple-400',
    Gentleness: 'border-teal-400/50 hover:border-teal-400',
    'Self-Control': 'border-indigo-400/50 hover:border-indigo-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Fruits of the Spirit</h1>
        <p className="text-muted-foreground font-body mt-1">Based on Galatians 5:22-23 — cultivate spiritual fruit daily</p>
      </div>

      {selectedFruit ? (
        <div className="space-y-4">
          <button onClick={() => setSelectedFruit(null)} className="text-sm text-accent hover:underline font-body">← Back to all fruits</button>
          <div className="rounded-xl bg-card border border-border p-6 shadow-soft space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedFruit.fruit_name}</h2>
            {selectedFruit.description && <p className="font-body text-muted-foreground">{selectedFruit.description}</p>}
            {selectedFruit.scripture_ref && (
              <div className="rounded-lg bg-gradient-navy p-4">
                <p className="font-body text-sm italic text-primary-foreground">{selectedFruit.scripture_ref}</p>
              </div>
            )}
            {selectedFruit.exercise_text && (
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                <p className="font-body text-sm font-medium text-foreground">Today's Exercise:</p>
                <p className="font-body text-sm text-muted-foreground mt-1">{selectedFruit.exercise_text}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-card border border-border p-5 shadow-soft space-y-3">
            <h3 className="font-heading text-lg font-semibold text-foreground">Daily Reflection</h3>
            <Textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="How did you practice this fruit today?" rows={3} className="font-body" />
            <Button variant="gold" onClick={logReflection} disabled={submitting || !reflection.trim()}>
              {submitting ? 'Logging...' : 'Log Reflection'}
            </Button>
          </div>

          {fruitLog.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-semibold text-foreground">Your Journey</h3>
              {fruitLog.map(log => (
                <div key={log.id} className="rounded-lg bg-card border border-border p-3">
                  <p className="font-body text-sm text-foreground">{log.reflection}</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">{new Date(log.logged_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fruits.map(fruit => (
            <button
              key={fruit.id}
              onClick={() => selectFruit(fruit)}
              className={`rounded-xl bg-card border-2 p-5 text-left shadow-soft hover:shadow-card transition-all ${fruitColors[fruit.fruit_name] || 'border-border hover:border-accent/50'}`}
            >
              <h3 className="font-heading text-lg font-semibold text-foreground">{fruit.fruit_name}</h3>
              <p className="font-body text-sm text-muted-foreground mt-1 line-clamp-2">{fruit.description}</p>
              <p className="text-xs text-accent font-body font-medium mt-3">Practice today →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
