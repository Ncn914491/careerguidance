-- Fix RLS policies to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Create simpler, non-recursive policies

-- Groups: Allow all authenticated users to read groups (simpler approach)
CREATE POLICY "Authenticated users can view groups" ON groups FOR SELECT USING (auth.uid() IS NOT NULL);

-- Group members: Allow users to manage their own memberships
CREATE POLICY "Users can view group memberships" ON group_members FOR SELECT USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can manage their group memberships" ON group_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Group messages: Check membership directly without recursion
CREATE POLICY "Group members can view messages" ON group_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Group members can send messages" ON group_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);