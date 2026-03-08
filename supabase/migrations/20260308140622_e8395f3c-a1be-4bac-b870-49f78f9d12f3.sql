
-- Join requests for groups (users apply to private groups)
CREATE TABLE public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own requests" ON public.group_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests" ON public.group_join_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests" ON public.group_join_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Plan enrollments (users apply to plans, admin can enroll directly)
CREATE TABLE public.plan_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, user_id)
);

ALTER TABLE public.plan_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own enrollments" ON public.plan_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own enrollments" ON public.plan_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments" ON public.plan_enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage plan_days
CREATE POLICY "Admins can manage plan days" ON public.plan_days
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_enrollments;
