-- Comprehensive RLS Policy Fix
-- This script fixes all RLS policies for Groups, Weeks, Messages, and related tables

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;
DROP POLICY IF EXISTS "Everyone can view groups" ON groups;
DROP POLICY IF EXISTS "Only admins can update groups" ON groups;
DROP POLICY IF EXISTS "Only admins can delete groups" ON groups;

-- Authenticated users can read all groups
CREATE POLICY "Authenticated users can read groups" ON groups 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups" ON groups 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update groups
CREATE POLICY "Admins can update groups" ON groups 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete groups
CREATE POLICY "Admins can delete groups" ON groups 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON group_members;

-- Authenticated users can read group memberships
CREATE POLICY "Authenticated users can read memberships" ON group_members 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Students can join groups (insert their own membership)
CREATE POLICY "Students can join groups" ON group_members 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- Users can leave groups (delete their own membership) or admins can manage all
CREATE POLICY "Users can leave groups or admins can manage" ON group_members 
FOR DELETE USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update memberships (change roles, etc.)
CREATE POLICY "Admins can update memberships" ON group_members 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUP_MESSAGES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Group members can read messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;

-- Authenticated users can read messages (for groups they're in)
CREATE POLICY "Authenticated users can read messages" ON group_messages 
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- User is a member of the group
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
    -- Or user is an admin
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Group members can send messages
CREATE POLICY "Group members can send messages" ON group_messages 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND sender_id = auth.uid() AND
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);

-- Only admins can delete messages
CREATE POLICY "Admins can delete messages" ON group_messages 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- WEEKS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can read weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can manage weeks" ON weeks;

-- Authenticated users can read weeks
CREATE POLICY "Authenticated users can read weeks" ON weeks 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can create weeks
CREATE POLICY "Admins can create weeks" ON weeks 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update weeks
CREATE POLICY "Admins can update weeks" ON weeks 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete weeks
CREATE POLICY "Admins can delete weeks" ON weeks 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- WEEK_FILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can read week files" ON week_files;
DROP POLICY IF EXISTS "Admins can manage week files" ON week_files;

-- Authenticated users can read week files
CREATE POLICY "Authenticated users can read week files" ON week_files 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can upload week files
CREATE POLICY "Admins can upload week files" ON week_files 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update week files
CREATE POLICY "Admins can update week files" ON week_files 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete week files
CREATE POLICY "Admins can delete week files" ON week_files 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Authenticated users can read all profiles (needed for displaying names, etc.)
CREATE POLICY "Authenticated users can read profiles" ON profiles 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (id = auth.uid());

-- Only admins can insert profiles (usually handled by triggers)
CREATE POLICY "Admins can insert profiles" ON profiles 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.uid() = id -- Allow users to create their own profile
);

-- ============================================================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin (if not exists)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is group member
CREATE OR REPLACE FUNCTION is_group_member(group_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = is_group_member.group_id 
    AND group_members.user_id = is_group_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;