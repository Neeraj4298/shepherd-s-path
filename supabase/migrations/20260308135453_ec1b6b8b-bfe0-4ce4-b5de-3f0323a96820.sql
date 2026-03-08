
-- Add group visibility and chat mode
CREATE TYPE public.group_visibility AS ENUM ('public', 'private_visible', 'private_hidden');
CREATE TYPE public.group_chat_mode AS ENUM ('open', 'broadcast');

ALTER TABLE public.study_groups ADD COLUMN visibility group_visibility NOT NULL DEFAULT 'public';
ALTER TABLE public.study_groups ADD COLUMN chat_mode group_chat_mode NOT NULL DEFAULT 'open';

-- Update RLS: public groups visible to all, private_visible visible to all, private_hidden only to members/admins
DROP POLICY IF EXISTS "Groups are public" ON public.study_groups;

CREATE POLICY "Public and visible groups are readable" ON public.study_groups
  FOR SELECT USING (
    visibility IN ('public', 'private_visible')
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid())
  );

-- Update group_members: for private groups, only admin can add members
-- We need an INSERT policy that checks group visibility
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

CREATE POLICY "Users can join public groups" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.study_groups sg WHERE sg.id = group_id AND sg.visibility = 'public'
    )
  );

-- For chat_messages in broadcast groups, only admin can send
-- We'll add a policy that checks group chat_mode via chat_rooms -> group_id -> study_groups
-- First, auto-create chat rooms for groups (we'll handle this in code)

-- Enable realtime for group-related updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
