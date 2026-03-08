import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GraduationCap, Check, Circle, Clock, XCircle, Plus, Users, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
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
  user_id: string;
  status: string;
  profiles?: { full_name: string } | null;
}

export default function StudyPlansPage() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [enrollments, setEnrollments] = useState<Map<string, Enrollment>>(new Map());
  const [loading, setLoading] = useState(true);

  // Admin state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDays, setNewDays] = useState('7');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'progress' | 'enrollments'>('progress');
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);

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

  const createPlan = async () => {
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    const days = parseInt(newDays) || 7;
    const { data: plan, error } = await supabase.from('study_plans').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      duration_days: days,
      created_by: user.id,
      type: 'global' as const,
    }).select().single();

    if (error) { toast.error('Failed to create plan'); setCreating(false); return; }

    // Auto-generate plan days
    if (plan) {
      const dayInserts = Array.from({ length: days }, (_, i) => ({
        plan_id: plan.id,
        day_number: i + 1,
      }));
      await supabase.from('plan_days').insert(dayInserts);
    }

    toast.success('Study plan created!');
    setNewTitle(''); setNewDesc(''); setNewDays('7'); setShowCreate(false);
    fetchPlans();
    setCreating(false);
  };

  const deletePlan = async (planId: string) => {
    await supabase.from('plan_days').delete().eq('plan_id', planId);
    await supabase.from('study_plans').delete().eq('id', planId);
    toast.success('Plan deleted');
    setSelectedPlan(null);
    fetchPlans();
  };

  const selectPlan = async (plan: StudyPlan) => {
    setSelectedPlan(plan);
    setActiveTab('progress');
    const { data: days } = await supabase.from('plan_days').select('*').eq('plan_id', plan.id).order('day_number');
    if (days) setPlanDays(days);

    if (user) {
      const { data: progress } = await supabase.from('plan_progress').select('day_id').eq('user_id', user.id).eq('plan_id', plan.id);
      if (progress) setCompletedDays(new Set(progress.map(p => p.day_id)));
    }

    if (isAdmin) fetchPlanEnrollments(plan.id);
  };

  const fetchPlanEnrollments = async (planId: string) => {
    const { data } = await supabase.from('plan_enrollments').select('*').eq('plan_id', planId).order('enrolled_at', { ascending: false });
    if (data) {
      const userIds = data.map(e => e.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setAllEnrollments(data.map(e => ({ ...e, profiles: profileMap.get(e.user_id) || null })));
      } else {
        setAllEnrollments([]);
      }
    }
  };

  const approveEnrollment = async (enrollment: Enrollment) => {
    await supabase.from('plan_enrollments').update({ status: 'approved' }).eq('id', enrollment.id);
    toast.success('Enrollment approved');
    if (selectedPlan) fetchPlanEnrollments(selectedPlan.id);
  };

  const rejectEnrollment = async (enrollmentId: string) => {
    await supabase.from('plan_enrollments').update({ status: 'rejected' }).eq('id', enrollmentId);
    toast.success('Enrollment rejected');
    if (selectedPlan) fetchPlanEnrollments(selectedPlan.id);
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

  const getEnrollmentStatus = (planId: string) => enrollments.get(planId)?.status || null;

  const statusBadge = (status: string | null) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1 text-xs font-body text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full"><Check className="h-3 w-3" />Enrolled</span>;
    if (status === 'pending') return <span className="inline-flex items-center gap-1 text-xs font-body text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />Pending</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-xs font-body text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" />Rejected</span>;
    return null;
  };

  const pendingEnrollments = allEnrollments.filter(e => e.status === 'pending');

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  // ──── Selected plan view ────
  if (selectedPlan) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPlan(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedPlan.title}</h2>
              {statusBadge(getEnrollmentStatus(selectedPlan.id))}
            </div>
            {selectedPlan.description && <p className="text-muted-foreground font-body mt-1">{selectedPlan.description}</p>}
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" variant={activeTab === 'progress' ? 'default' : 'outline'} onClick={() => setActiveTab('progress')} className="font-body">
                <GraduationCap className="h-4 w-4" />
              </Button>
              <Button size="sm" variant={activeTab === 'enrollments' ? 'default' : 'outline'} onClick={() => setActiveTab('enrollments')} className="font-body relative">
                <UserPlus className="h-4 w-4" />
                {pendingEnrollments.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {pendingEnrollments.length}
                  </span>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => deletePlan(selectedPlan.id)} className="text-destructive font-body">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Enrollments tab (admin) */}
        {activeTab === 'enrollments' && isAdmin && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Enrollment Requests</h3>
            {pendingEnrollments.length > 0 ? (
              <div className="space-y-2">
                {pendingEnrollments.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-accent/5 border border-accent/20">
                    <div>
                      <span className="font-body text-sm text-foreground">{e.profiles?.full_name || 'Unknown'}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="gold" onClick={() => approveEnrollment(e)} className="h-8 px-3 font-body">
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectEnrollment(e.id)} className="h-8 px-3 text-destructive font-body">
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-body text-sm text-center py-4">No pending enrollment requests</p>
            )}

            {allEnrollments.filter(e => e.status !== 'pending').length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wide">History</p>
                {allEnrollments.filter(e => e.status !== 'pending').map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-md px-3 py-1.5">
                    <span className="font-body text-sm text-foreground">{e.profiles?.full_name || 'Unknown'}</span>
                    <span className={`text-xs font-body px-2 py-0.5 rounded-full ${e.status === 'approved' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {getEnrollmentStatus(selectedPlan.id) === 'approved' && (
              <div className="rounded-xl bg-card border border-border p-5 shadow-soft">
                <Progress value={planDays.length > 0 ? (completedDays.size / planDays.length) * 100 : 0} className="h-3" />
                <p className="text-sm text-muted-foreground font-body mt-2">{completedDays.size} / {planDays.length} days completed</p>
              </div>
            )}

            {!getEnrollmentStatus(selectedPlan.id) && !isAdmin && (
              <Button variant="gold" onClick={() => applyToPlan(selectedPlan.id)} className="font-body">
                Apply to Join This Plan
              </Button>
            )}
            {getEnrollmentStatus(selectedPlan.id) === 'pending' && (
              <p className="text-sm text-amber-600 font-body">⏳ Your application is pending admin approval.</p>
            )}

            {(getEnrollmentStatus(selectedPlan.id) === 'approved' || isAdmin) && (
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
        )}
      </div>
    );
  }

  // ──── Plans list view ────
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Study Plans</h1>
          <p className="text-muted-foreground font-body mt-1">Follow structured Bible reading plans</p>
        </div>
        {isAdmin && (
          <Button variant="gold" onClick={() => setShowCreate(!showCreate)} className="font-body">
            <Plus className="h-4 w-4 mr-2" /> Create Plan
          </Button>
        )}
      </div>

      {/* Admin create form */}
      {isAdmin && showCreate && (
        <div className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-soft">
          <h2 className="font-heading text-lg font-semibold text-foreground">New Study Plan</h2>
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Plan title..." className="font-body" />
          <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." rows={2} className="font-body" />
          <div className="space-y-2">
            <Label className="font-body text-sm font-medium">Duration (days)</Label>
            <Input type="number" min="1" value={newDays} onChange={e => setNewDays(e.target.value)} className="font-body w-32" />
          </div>
          <div className="flex gap-2">
            <Button variant="gold" onClick={createPlan} disabled={creating || !newTitle.trim()} className="font-body">
              <Plus className="h-4 w-4 mr-2" /> Create
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-body">Cancel</Button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-body">No study plans available yet.{isAdmin ? ' Create your first one above!' : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(p => {
            const status = getEnrollmentStatus(p.id);
            return (
              <button key={p.id} onClick={() => selectPlan(p)} className="rounded-xl bg-card border border-border p-5 shadow-soft text-left hover:border-accent/50 hover:shadow-card transition-all">
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
      )}
    </div>
  );
}
