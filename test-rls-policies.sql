-- Test script to verify RLS policies are working correctly
-- This script can be run in Supabase SQL Editor to test policy functionality

-- Test 1: Check that all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'weeks', 'groups', 'group_members', 'group_messages')
ORDER BY tablename, policyname;

-- Test 2: Verify helper functions exist
SELECT 
  routine_name,
  routine_type,
  specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'is_group_member')
ORDER BY routine_name;

-- Test 3: Check that RLS is enabled on all required tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'weeks', 'groups', 'group_members', 'group_messages')
ORDER BY tablename;

-- Test 4: Verify chats view exists and works
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'chats';

-- Expected Results Summary:
-- 1. Should see policies with clear naming pattern (table_action_condition)
-- 2. Helper functions is_admin and is_group_member should exist
-- 3. All tables should have rowsecurity = true
-- 4. Chats view should exist and map to group_messages

-- Policy Summary (what should be created):
-- PROFILES: 4 policies (select_authenticated, insert_own_or_admin, update_own_or_admin, delete_admin)
-- WEEKS: 4 policies (select_authenticated, insert_admin, update_admin, delete_admin)
-- GROUPS: 4 policies (select_authenticated, insert_authenticated, update_admin, delete_admin)
-- GROUP_MEMBERS: 4 policies (select_authenticated, insert_join, delete_leave_or_admin, update_admin)
-- GROUP_MESSAGES: 4 policies (select_members, insert_members, update_admin, delete_admin)
