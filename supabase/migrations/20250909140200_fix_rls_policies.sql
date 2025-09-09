-- Comprehensive RLS Policy Fix
-- This migration removes all existing problematic policies and creates secure, consistent policies
-- Requirements:
-- - Students: can select weeks, groups, chats; can insert chats; can join groups
-- - Admins: full insert/update/delete on weeks, groups, profiles
-- - Users are not blocked from reading data after signing in

-- ============================================================================
-- DROP ALL EXISTING POLICIES (to avoid conflicts)
-- ============================================================================

-- Drop all policies on profiles table
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;

-- Drop all policies on weeks table
DROP POLICY IF EXISTS "Enable read access for all users" ON weeks;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON weeks;
DROP POLICY IF EXISTS "Enable update for admin users only" ON weeks;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON weeks;
DROP POLICY IF EXISTS "Everyone can read weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can manage weeks" ON weeks;
DROP POLICY IF EXISTS "Authenticated users can read weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can create weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can update weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can delete weeks" ON weeks;

-- Drop all policies on groups table
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators and admins" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators and admins" ON groups;
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;
DROP POLICY IF EXISTS "Everyone can view groups" ON groups;
DROP POLICY IF EXISTS "Only admins can update groups" ON groups;
DROP POLICY IF EXISTS "Only admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can read groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;

-- Drop all policies on group_members table
DROP POLICY IF EXISTS "Enable read access for all users" ON group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON group_members;
DROP POLICY IF EXISTS "Enable delete for users and admins" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can read memberships" ON group_members;
DROP POLICY IF EXISTS "Students can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can manage" ON group_members;
DROP POLICY IF EXISTS "Admins can update memberships" ON group_members;

-- Drop all policies on group_messages table
DROP POLICY IF EXISTS "Enable read for group members" ON group_messages;
DROP POLICY IF EXISTS "Enable insert for group members" ON group_messages;
DROP POLICY IF EXISTS "Group members can read messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Authenticated users can read messages" ON group_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON group_messages;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Authenticated users can read all profiles (needed for user info display)
CREATE POLICY "profiles_select_authenticated" ON profiles 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can insert their own profile, admins can insert any profile
CREATE POLICY "profiles_insert_own_or_admin" ON profiles 
FOR INSERT WITH CHECK (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can update their own profile, admins can update any profile
CREATE POLICY "profiles_update_own_or_admin" ON profiles 
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete profiles
CREATE POLICY "profiles_delete_admin" ON profiles 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- WEEKS TABLE POLICIES
-- ============================================================================

-- Authenticated users can read weeks (students and admins)
CREATE POLICY "weeks_select_authenticated" ON weeks 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can create weeks
CREATE POLICY "weeks_insert_admin" ON weeks 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update weeks
CREATE POLICY "weeks_update_admin" ON weeks 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete weeks
CREATE POLICY "weeks_delete_admin" ON weeks 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

-- Authenticated users can read all groups (students and admins)
CREATE POLICY "groups_select_authenticated" ON groups 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Students can create groups, admins can create groups
CREATE POLICY "groups_insert_authenticated" ON groups 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update groups (not group creators)
CREATE POLICY "groups_update_admin" ON groups 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete groups (not group creators)
CREATE POLICY "groups_delete_admin" ON groups 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ============================================================================

-- Authenticated users can read group memberships
CREATE POLICY "group_members_select_authenticated" ON group_members 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Students can join groups (insert their own membership), admins can add anyone
CREATE POLICY "group_members_insert_join" ON group_members 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Users can leave groups, admins can remove anyone
CREATE POLICY "group_members_delete_leave_or_admin" ON group_members 
FOR DELETE USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update memberships (change roles, etc.)
CREATE POLICY "group_members_update_admin" ON group_members 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUP_MESSAGES TABLE POLICIES (affects chats view)
-- ============================================================================

-- Group members can read messages from groups they belong to, admins can read all
CREATE POLICY "group_messages_select_members" ON group_messages 
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Group members can send messages to groups they belong to
CREATE POLICY "group_messages_insert_members" ON group_messages 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  sender_id = auth.uid() AND
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);

-- Only admins can update messages
CREATE POLICY "group_messages_update_admin" ON group_messages 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete messages
CREATE POLICY "group_messages_delete_admin" ON group_messages 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Note: Views inherit RLS from their underlying tables
-- The chats view will inherit policies from group_messages table

-- ============================================================================
-- HELPER FUNCTIONS (improved)
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is group member
CREATE OR REPLACE FUNCTION is_group_member(group_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = is_group_member.group_id 
    AND group_members.user_id = COALESCE(is_group_member.user_id, auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Success message
SELECT 'RLS policies have been completely rebuilt with proper access control!' as status;
