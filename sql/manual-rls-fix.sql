-- MANUAL RLS FIX
-- Execute these commands in Supabase Dashboard > SQL Editor
-- This will fix the infinite recursion in RLS policies

-- 1. Temporarily disable RLS to avoid recursion issues
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;

-- 3. Create new, simpler policies without recursion

-- Groups policies - allow all authenticated users to read groups
CREATE POLICY "authenticated_users_can_read_groups" ON groups 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_create_groups" ON groups 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "creators_can_update_groups" ON groups 
FOR UPDATE USING (created_by = auth.uid());

-- Group members policies - simple user-based access
CREATE POLICY "users_can_read_memberships" ON group_members 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_join_groups" ON group_members 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_leave_groups" ON group_members 
FOR DELETE USING (user_id = auth.uid());

-- Group messages policies - check membership without recursion
CREATE POLICY "members_can_read_messages" ON group_messages 
FOR SELECT USING (
  sender_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_messages.group_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "members_can_send_messages" ON group_messages 
FOR INSERT WITH CHECK (
  sender_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_messages.group_id 
    AND user_id = auth.uid()
  )
);

-- 4. Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;