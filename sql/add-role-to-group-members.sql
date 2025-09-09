ALTER TABLE public.group_members
ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member'));
