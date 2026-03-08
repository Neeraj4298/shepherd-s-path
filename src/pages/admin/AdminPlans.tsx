import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, UserPlus, Check, X, Calendar, Users } from 'lucide-react';

interface Plan {
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
  user_id: string;
  status: string;
  enrolled_at: string;
  profiles?: { full_name: string } | null;
}

export default function AdminPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState('30');
  const [creating, setCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'days' | 'enrollments'>('days');

  const fetchPlans = async () => {
    const { data } = await supabase.from('study_plans').select('*').order('created_at', { ascending: false });
    if (data) setPlans(data);
  };

  const fetchPlanDays = async (planId: string) => {
    const { data } = await supabase.from('plan_days').select('*').eq('plan_id', planId).order('day_number');
    if (data) setPlanDays(data);
  };

  const fetchEnrollments = async (planId: string) => {
    const { data } = await supabase
      .from('plan_enrollments')
      .select('*')
      .eq('plan_id', planId)
      .order('enrolled_at', { ascending: false });
    if (data) {
      // Fetch profile names
      const userIds = data.map(e => e.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setEnrollments(data.map(e => ({ ...e, profiles: profileMap.get(e.user_id) || null })) as Enrollment[]);
    }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('status', 'approved');
    if (data) setAllUsers(data);
  };

  useEffect(() => { fetchPlans(); fetchAllUsers(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const { data: plan, error } = await supabase.from('study_plans').insert({
      title: title.trim(),
      description: desc.trim() || null,
      duration_days: parseInt(days) || 30,
      created_by: user?.id,
      type: 'global' as const,
    }).select().single();

    if (error) { toast.error('Failed to create plan'); setCreating(false); return; }

    // Auto-generate days for the plan
    if (plan) {
      const daysToInsert = Array.from({ length: parseInt(days) || 30 }, (_, i) => ({
        plan_id: plan.id,
        day_number: i + 1,
      }));
      await supabase.from('plan_days').insert(daysToInsert);
    }

    toast.success('Plan created with days!');
    setTitle(''); setDesc(''); setDays('30');
    fetchPlans();
    setCreating(false);
  };

  const remove = async (id: string) => {
    await supabase.from('study_plans').delete().eq('id', id);
    toast.success('Plan deleted'); setSelectedPlan(null); fetchPlans();
  };

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setActiveTab('days');
    fetchPlanDays(plan.id);
    fetchEnrollments(plan.id);
    setAddingUser(false);
  };

  const addDay = async () => {
    if (!selectedPlan) return;
    const nextDay = planDays.length > 0 ? Math.max(...planDays.map(d => d.day_number)) + 1 : 1;
    await supabase.from('plan_days').insert({ plan_id: selectedPlan.id, day_number: nextDay });
    toast.success(`Day ${nextDay} added`);
    fetchPlanDays(selectedPlan.id);
  };

  const removeDay = async (dayId: string) => {
    await supabase.from('plan_days').delete().eq('id', dayId);
    toast.success('Day removed');
    if (selectedPlan) fetchPlanDays(selectedPlan.id);
  };

  const enrollUser = async (userId: string) => {
    if (!selectedPlan) return;
    const { error } = await supabase.from('plan_enrollments').insert({
      plan_id: selectedPlan.id,
      user_id: userId,
      status: 'approved',
    });
    if (error) toast.error(error.message);
    else { toast.success('User enrolled'); fetchEnrollments(selectedPlan.id); }
  };

  const updateEnrollmentStatus = async (enrollmentId: string, status: string) => {
    await supabase.from('plan_enrollments').update({ status }).eq('id', enrollmentId);
    toast.success(`Enrollment ${status}`);
    if (selectedPlan) fetchEnrollments(selectedPlan.id);
  };

  const removeEnrollment = async (enrollmentId: string) => {
    await supabase.from('plan_enrollments').delete().eq('id', enrollmentId);
    toast.success('Enrollment removed');
    if (selectedPlan) fetchEnrollments(selectedPlan.id);
  };

  const enrolledUserIds = new Set(enrollments.map(e => e.user_id));
  const nonEnrolled = allUsers.filter(u => !enrolledUserIds.has(u.id)).filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()));
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
  const approvedEnrollments = enrollments.filter(e => e.status === 'approved');

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold text-foreground">Study Plan Management</h1>

      {selectedPlan ? (
        <div className="space-y-5">
          <button onClick={() => setSelectedPlan(null)} className="text-sm text-accent hover:underline font-body">← Back to plans</button>

          <div className="rounded-xl bg-card border border-border p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">{selectedPlan.title}</h2>
                {selectedPlan.description && <p className="text-muted-foreground font-body mt-1">{selectedPlan.description}</p>}
                <p className="text-sm text-muted-foreground font-body mt-1">{selectedPlan.duration_days} days · {planDays.length} days configured · {approvedEnrollments.length} enrolled</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => remove(selectedPlan.id)} className="text-destructive font-body">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button size="sm" variant={activeTab === 'days' ? 'default' : 'outline'} onClick={() => setActiveTab('days')} className="font-body">
              <Calendar className="h-4 w-4 mr-1" /> Days ({planDays.length})
            </Button>
            <Button size="sm" variant={activeTab === 'enrollments' ? 'default' : 'outline'} onClick={() => setActiveTab('enrollments')} className="font-body">
              <Users className="h-4 w-4 mr-1" /> Enrollments ({enrollments.length})
              {pendingEnrollments.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs">
                  {pendingEnrollments.length}
                </span>
              )}
            </Button>
          </div>

          {activeTab === 'days' ? (
            <div className="rounded-xl bg-card border border-border p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold text-foreground">Plan Days</h3>
                <Button size="sm" variant="gold" onClick={addDay} className="font-body">
                  <Plus className="h-4 w-4 mr-1" /> Add Day
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {planDays.map(day => (
                  <div key={day.id} className="relative group rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <span className="font-body text-sm font-medium text-foreground">Day {day.day_number}</span>
                    <button
                      onClick={() => removeDay(day.id)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              {planDays.length === 0 && <p className="text-muted-foreground font-body text-sm text-center py-4">No days yet. Click "Add Day" to start.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending requests */}
              {pendingEnrollments.length > 0 && (
                <div className="rounded-xl bg-card border border-accent/30 p-5 shadow-soft space-y-3">
                  <h3 className="font-heading text-lg font-semibold text-accent">Pending Requests ({pendingEnrollments.length})</h3>
                  {pendingEnrollments.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/30">
                      <span className="font-body text-sm text-foreground">{e.profiles?.full_name || 'Unknown'}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="gold" onClick={() => updateEnrollmentStatus(e.id, 'approved')} className="h-8 px-3 font-body">
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateEnrollmentStatus(e.id, 'rejected')} className="h-8 px-3 text-destructive font-body">
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enrolled users */}
              <div className="rounded-xl bg-card border border-border p-5 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" /> Enrolled ({approvedEnrollments.length})
                  </h3>
                  <Button size="sm" variant="gold" onClick={() => setAddingUser(!addingUser)} className="font-body">
                    <UserPlus className="h-4 w-4 mr-1" /> Add User
                  </Button>
                </div>

                {addingUser && (
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="font-body" />
                    <div className="max-h-48 overflow-auto space-y-1">
                      {nonEnrolled.map(u => (
                        <button key={u.id} onClick={() => enrollUser(u.id)} className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-body hover:bg-background transition-colors">
                          <span className="text-foreground">{u.full_name}</span>
                          <Plus className="h-4 w-4 text-accent" />
                        </button>
                      ))}
                      {nonEnrolled.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-2">No users to add</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {approvedEnrollments.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                      <span className="font-body text-sm text-foreground">{e.profiles?.full_name || 'Unknown'}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeEnrollment(e.id)} className="text-destructive h-8 w-8 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {approvedEnrollments.length === 0 && <p className="text-muted-foreground font-body text-sm text-center py-4">No enrolled users yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-card border border-border p-5 space-y-3">
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
              <button key={p.id} onClick={() => openPlan(p)} className="w-full rounded-lg bg-card border border-border p-4 flex items-center justify-between hover:border-accent/50 transition-all text-left">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{p.duration_days} days · {p.type}</p>
                </div>
              </button>
            ))}
            {plans.length === 0 && <p className="text-muted-foreground font-body text-center py-8">No plans yet. Create your first one above!</p>}
          </div>
        </>
      )}
    </div>
  );
}
