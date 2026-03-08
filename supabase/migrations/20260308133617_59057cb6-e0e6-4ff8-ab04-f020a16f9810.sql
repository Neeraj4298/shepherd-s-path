
-- Enums
CREATE TYPE public.user_status AS ENUM ('pending_approval', 'approved', 'banned');
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.testimony_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.chat_room_type AS ENUM ('general', 'group', 'prayer');
CREATE TYPE public.support_contact_type AS ENUM ('whatsapp', 'instagram');
CREATE TYPE public.study_plan_type AS ENUM ('personal', 'global');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  instagram_username TEXT,
  status user_status NOT NULL DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, instagram_username, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'instagram_username',
    'pending_approval'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bible books
CREATE TABLE public.bible_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('old', 'new')),
  chapter_count INT NOT NULL,
  book_order INT NOT NULL
);
ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bible books are public" ON public.bible_books FOR SELECT USING (true);

-- Bible chapters
CREATE TABLE public.bible_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.bible_books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  UNIQUE(book_id, chapter_number)
);
ALTER TABLE public.bible_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bible chapters are public" ON public.bible_chapters FOR SELECT USING (true);

-- Bible study progress
CREATE TABLE public.bible_study_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.bible_chapters(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  reflection TEXT,
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE public.bible_study_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON public.bible_study_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.bible_study_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Study plans
CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_days INT NOT NULL,
  type study_plan_type NOT NULL DEFAULT 'global',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Study plans are public" ON public.study_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON public.study_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Plan days
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  chapter_id UUID REFERENCES public.bible_chapters(id) ON DELETE SET NULL
);
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plan days are public" ON public.plan_days FOR SELECT USING (true);

-- Plan progress
CREATE TABLE public.plan_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_id)
);
ALTER TABLE public.plan_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own plan progress" ON public.plan_progress FOR ALL USING (auth.uid() = user_id);

-- Study groups
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are public" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Admins can manage groups" ON public.study_groups FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view groups" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage members" ON public.group_members FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Prayer requests
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  prayer_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved prayers are public" ON public.prayer_requests FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create prayers" ON public.prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage prayers" ON public.prayer_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Prayer responses
CREATE TABLE public.prayer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Responses are public" ON public.prayer_responses FOR SELECT USING (true);
CREATE POLICY "Users can respond" ON public.prayer_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Testimonies
CREATE TABLE public.testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status testimony_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved testimonies are public" ON public.testimonies FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can submit testimonies" ON public.testimonies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage testimonies" ON public.testimonies FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Chat rooms
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type chat_room_type NOT NULL DEFAULT 'general',
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat rooms are public" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "Admins can manage rooms" ON public.chat_rooms FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are visible" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage messages" ON public.chat_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Addiction categories
CREATE TABLE public.addiction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT
);
ALTER TABLE public.addiction_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.addiction_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.addiction_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User addictions
CREATE TABLE public.user_addictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addiction_id UUID NOT NULL REFERENCES public.addiction_categories(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, addiction_id)
);
ALTER TABLE public.user_addictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own addictions" ON public.user_addictions FOR ALL USING (auth.uid() = user_id);

-- Addiction guidance
CREATE TABLE public.addiction_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addiction_id UUID NOT NULL REFERENCES public.addiction_categories(id) ON DELETE CASCADE,
  scripture TEXT,
  steps TEXT,
  prayer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addiction_guidance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guidance is public" ON public.addiction_guidance FOR SELECT USING (true);
CREATE POLICY "Admins can manage guidance" ON public.addiction_guidance FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Fruits of the Spirit exercises
CREATE TABLE public.fruits_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_name TEXT NOT NULL,
  description TEXT,
  exercise_text TEXT,
  scripture_ref TEXT
);
ALTER TABLE public.fruits_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fruits are public" ON public.fruits_exercises FOR SELECT USING (true);
CREATE POLICY "Admins can manage fruits" ON public.fruits_exercises FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User fruit progress
CREATE TABLE public.user_fruit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fruit_id UUID NOT NULL REFERENCES public.fruits_exercises(id) ON DELETE CASCADE,
  reflection TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_fruit_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own fruit progress" ON public.user_fruit_progress FOR ALL USING (auth.uid() = user_id);

-- Guidance topics
CREATE TABLE public.guidance_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  bible_verse TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guidance_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are public" ON public.guidance_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage topics" ON public.guidance_topics FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Support contacts
CREATE TABLE public.support_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  type support_contact_type NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contacts are public" ON public.support_contacts FOR SELECT USING (true);
CREATE POLICY "Admins can manage contacts" ON public.support_contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are public" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for chat and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
