-- COMPREHENSIVE FIX FOR SIGNUP AND RLS ISSUES
-- This script fixes authentication flow and RLS policies to allow proper signup without email verification
-- and fixes group access issues

BEGIN;

-- ============================================================================
-- 1. CLEAN UP EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all existing RLS policies that might be causing conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Clean up groups policies
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;
DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can insert groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;

-- Clean up group_members policies
DROP POLICY IF EXISTS "Group members are viewable by everyone" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Anyone can view group members" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON group_members;

-- Clean up group_messages policies
DROP POLICY IF EXISTS "Group messages are viewable by members" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Members can view group messages" ON group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;

-- ============================================================================
-- 2. RECREATE PROFILE CREATION SYSTEM
-- ============================================================================

-- Drop existing trigger and function safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create/update profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. CREATE PERMISSIVE RLS POLICIES
-- ============================================================================

-- Profiles policies - Very permissive to avoid signup issues
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Groups policies - Allow everyone to view and authenticated users to create
CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group creators and admins can update groups" ON groups FOR UPDATE 
USING (
  auth.uid() = created_by 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Group creators and admins can delete groups" ON groups FOR DELETE 
USING (
  auth.uid() = created_by 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Group members policies - Allow viewing and joining
CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join groups" ON group_members FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can manage their own membership" ON group_members FOR DELETE 
USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Group messages policies - Members can view and send messages
CREATE POLICY "Group members can view messages" ON group_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_messages.group_id 
    AND user_id = auth.uid()
  )
  OR auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Group members can send messages" ON group_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_messages.group_id 
    AND user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. FIX OTHER TABLE POLICIES
-- ============================================================================

-- Weeks policies
DROP POLICY IF EXISTS "Anyone can view weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can create weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can update weeks" ON weeks;

CREATE POLICY "Anyone can view weeks" ON weeks FOR SELECT USING (true);

CREATE POLICY "Admins can manage weeks" ON weeks FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Week files policies
DROP POLICY IF EXISTS "Anyone can view week files" ON week_files;
DROP POLICY IF EXISTS "Admins can upload files" ON week_files;
DROP POLICY IF EXISTS "Admins can update files" ON week_files;

CREATE POLICY "Anyone can view week files" ON week_files FOR SELECT USING (true);

CREATE POLICY "Admins can manage week files" ON week_files FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Schools policies
DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
DROP POLICY IF EXISTS "Admins can create schools" ON schools;
DROP POLICY IF EXISTS "Admins can update schools" ON schools;

CREATE POLICY "Anyone can view schools" ON schools FOR SELECT USING (true);

CREATE POLICY "Admins can manage schools" ON schools FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Team members policies
DROP POLICY IF EXISTS "Anyone can view team members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);

CREATE POLICY "Admins can manage team members" ON team_members FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- AI chats policies
DROP POLICY IF EXISTS "Users can view own chats" ON ai_chats;
DROP POLICY IF EXISTS "Users can create chats" ON ai_chats;

CREATE POLICY "Users can manage own chats" ON ai_chats FOR ALL 
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Admin requests policies
DROP POLICY IF EXISTS "Users can view own requests or admins can view all" ON admin_requests;
DROP POLICY IF EXISTS "Authenticated users can create admin requests" ON admin_requests;
DROP POLICY IF EXISTS "Admins can update admin requests" ON admin_requests;

CREATE POLICY "Users can view own requests or admins view all" ON admin_requests FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Authenticated users can create requests" ON admin_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage requests" ON admin_requests FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default admin
CREATE OR REPLACE FUNCTION public.create_default_admin(admin_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please sign up first.', admin_email;
  END IF;
  
  -- Update profile as admin
  UPDATE profiles 
  SET role = 'admin', updated_at = NOW()
  WHERE id = admin_user_id;
  
  IF NOT FOUND THEN
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (admin_user_id, admin_email, admin_email, 'admin');
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure profile exists (for client-side use)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id UUID, user_email TEXT, user_name TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id, user_email, COALESCE(user_name, split_part(user_email, '@', 1)), 'student')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE DEFAULT GROUPS
-- ============================================================================

-- Create default groups that all users can join
INSERT INTO groups (id, name, description, created_by) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'General Discussion', 'General chat for all students', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Study Group', 'Academic discussions and study materials', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Career Guidance', 'Career advice and opportunities', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. STORAGE SETUP
-- ============================================================================

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('week-files', 'week-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view week files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload week files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update week files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete week files" ON storage.objects;

CREATE POLICY "Anyone can view week files" ON storage.objects FOR SELECT 
USING (bucket_id = 'week-files');

CREATE POLICY "Admins can manage week files" ON storage.objects FOR ALL 
USING (
  bucket_id = 'week-files' 
  AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- ============================================================================
-- 8. REFRESH AND COMMIT
-- ============================================================================

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================

-- After running this script:
-- 1. Disable email confirmation in Supabase Dashboard:
--    Go to Authentication > Settings > Email Auth > Disable "Enable email confirmations"
-- 
-- 2. Create your first admin user:
--    SELECT public.create_default_admin('your-email@example.com');
-- 
-- 3. Test signup flow:
--    - Users should be able to sign up without email verification
--    - Profiles should be created automatically
--    - Groups should be accessible to all users
--    - Admin features should work for admin users