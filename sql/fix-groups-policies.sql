-- Fix groups policies to allow proper access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;

-- Create new policies for groups
-- Everyone can view all groups (needed for the groups list)
CREATE POLICY "Everyone can view groups" ON groups FOR SELECT USING (true);

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update groups
CREATE POLICY "Only admins can update groups" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete groups
CREATE POLICY "Only admins can delete groups" ON groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update group_members policies to allow users to leave groups
DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;

-- Users can leave groups, admins can manage all memberships
CREATE POLICY "Users can manage their own membership" ON group_members FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add role column to group_members if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'group_members' AND column_name = 'role') THEN
        ALTER TABLE group_members ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin'));
    END IF;
END $$;