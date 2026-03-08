import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, Check, Circle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  duration_days: number;
  type: string;
}

interface PlanDay {
  id: string;
  day_number: number;
  chapter_id: string | null;
}

interface Enrollment {
  id: string;
  plan_id: string;
  status: string;
}

export default function StudyPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [enrollments, setEnrollments] = useState<Map<string, Enrollment>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from('study_plans').select('*').order('created_at', { ascending: false });
    if (data) setPlans(data);

    if (user) {
      const { data: enrs } = await supabase.from('plan_enrollments').select('*').eq('user_id', user.id);
      if (enrs) {
        const map = new Map<string, Enrollment>();
        enrs.forEach(e => map.set(e.plan_id, e as Enrollment));
        setEnrollments(map);
      }
    }
    setLoading(false);
  };

  const selectPlan = async (plan: StudyPlan) => {
    setSelectedPlan(plan);
    const { data: days } = await supabase.from('plan_days').select('*').eq('plan_id', plan.id).order('day_number');
    if (days) setPlanDays(days);

    if (user) {
      const { data: progress } = await supabase.from('plan_progress').select('day_id').eq('user_id', user.id).eq('plan_id', plan.id);
      if (progress) setCompletedDays(new Set(progress.map(p => p.day_id)));
    }
  };

  const applyToPlan = async (planId: string) => {
    if (!user) return;
    const { error } = await supabase.from('plan_enrollments').insert({ plan_id: planId, user_id: user.id, status: 'pending' });
    if (error) { toast.error('Already applied or error'); return; }
    toast.success('Application submitted! Waiting for admin approval.');
    fetchPlans();
  };

  const toggleDay = async (day: PlanDay) => {
    if (!user || !selectedPlan) return;
    const enrollment = enrollments.get(selectedPlan.id);
    if (!enrollment || enrollment.status !== 'approved') {
      toast.error('You must be enrolled to track progress');
      return;
    }

    if (completedDays.has(day.id)) {
      await supabase.from('plan_progress').delete().eq('user_id', user.id).eq('day_id', day.id);
      const newSet = new Set(completedDays);
      newSet.delete(day.id);
      setCompletedDays(newSet);
    } else {
      await supabase.from('plan_progress').insert({ user_id: user.id, plan_id: selectedPlan.id, day_id: day.id });
      setCompletedDays(new Set([...completedDays, day.id]));
      toast.success(`Day ${day.day_number} completed!`);
    }
  };

  const getEnrollmentStatus = (planId: string) => {
    return enrollments.get(planId)?.status || null;
  };

  const statusBadge = (status: string | null) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1 text-xs font-body text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full"><Check className="h-3 w-3" />Enrolled</span>;
    if (status === 'pending') return <span className="inline-flex items-center gap-1 text-xs font-body text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />Pending</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-xs font-body text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" />Rejected</span>;
    return null;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Study Plans</h1>
        <p className="text-muted-foreground font-body mt-1">Follow structured Bible reading plans</p>
      </div>

      {selectedPlan ? (
        <div className="space-y-4">
          <button onClick={() => setSelectedPlan(null)} className="text-sm text-accent hover:underline font-body">← Back to plans</button>
          <div className="rounded-xl bg-card border border-border p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedPlan.title}</h2>
              {statusBadge(getEnrollmentStatus(selectedPlan.id))}
            </div>
            {selectedPlan.description && <p className="text-muted-foreground font-body mt-1">{selectedPlan.description}</p>}

            {getEnrollmentStatus(selectedPlan.id) === 'approved' && (
              <div className="mt-4">
                <Progress value={planDays.length > 0 ? (completedDays.size / planDays.length) * 100 : 0} className="h-3" />
                <p className="text-sm text-muted-foreground font-body mt-2">{completedDays.size} / {planDays.length} days completed</p>
              </div>
            )}

            {!getEnrollmentStatus(selectedPlan.id) && (
              <Button variant="gold" onClick={() => applyToPlan(selectedPlan.id)} className="mt-4 font-body">
                Apply to Join This Plan
              </Button>
            )}
            {getEnrollmentStatus(selectedPlan.id) === 'pending' && (
              <p className="mt-4 text-sm text-amber-600 font-body">⏳ Your application is pending admin approval.</p>
            )}
          </div>

          {getEnrollmentStatus(selectedPlan.id) === 'approved' && (
            <div className="space-y-2">
              {planDays.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                    completedDays.has(day.id) ? 'bg-accent/5 border-accent' : 'bg-card border-border hover:border-accent/30'
                  }`}
                >
                  {completedDays.has(day.id) ? (
                    <Check className="h-5 w-5 text-accent shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-body text-foreground">Day {day.day_number}</span>
                </button>
              ))}
              {planDays.length === 0 && <p className="text-muted-foreground font-body text-center py-4">No days configured for this plan yet.</p>}
            </div>
          )}
        </div>
      ) : (
        plans.length === 0 ? (
          <div className="rounded-lg bg-card border border-border p-8 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-body">No study plans available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(p => {
              const status = getEnrollmentStatus(p.id);
              return (
                <button key={p.id} onClick={() => selectPlan(p)} className="rounded-lg bg-card border border-border p-5 shadow-soft text-left hover:border-accent/50 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold text-foreground">{p.title}</h3>
                    {statusBadge(status)}
                  </div>
                  {p.description && <p className="font-body text-muted-foreground text-sm mt-1 line-clamp-2">{p.description}</p>}
                  <p className="text-sm text-accent font-body font-medium mt-3">{p.duration_days} days</p>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
