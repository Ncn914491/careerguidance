-- COMPREHENSIVE DATABASE FIX
-- This script fixes all authentication, profile creation, and RLS policy issues
-- 
-- IMPORTANT: If you get a trigger dependency error, run sql/quick-trigger-fix.sql first
-- Then run this script
--
-- Run this in Supabase SQL Editor to resolve all current problems

BEGIN;

-- ============================================================================
-- 1. CLEAN UP EXISTING PROBLEMATIC POLICIES AND TRIGGERS
-- ============================================================================

-- Drop all existing RLS policies that might be causing conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;

-- Safely drop existing triggers and functions
-- First check if triggers exist and drop them with their dependencies
DO $$
BEGIN
    -- Drop triggers that depend on handle_new_user function
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
        RAISE NOTICE 'Dropped trigger: on_auth_user_created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_confirmed') THEN
        DROP TRIGGER on_auth_user_confirmed ON auth.users;
        RAISE NOTICE 'Dropped trigger: on_auth_user_confirmed';
    END IF;
    
    -- Now safely drop the function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        DROP FUNCTION public.handle_new_user() CASCADE;
        RAISE NOTICE 'Dropped function: handle_new_user';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
END $$;

-- ============================================================================
-- 2. CREATE PROFILE CREATION TRIGGER FUNCTION
-- ============================================================================

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. CREATE NEW RLS POLICIES WITH PROPER PERMISSIONS
-- ============================================================================

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Weeks policies (fix admin access)
DROP POLICY IF EXISTS "Weeks are viewable by everyone" ON weeks;
DROP POLICY IF EXISTS "Only admins can create weeks" ON weeks;
DROP POLICY IF EXISTS "Only admins can update weeks" ON weeks;

CREATE POLICY "Anyone can view weeks" ON weeks FOR SELECT USING (true);

CREATE POLICY "Admins can create weeks" ON weeks FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update weeks" ON weeks FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Week files policies (fix admin access)
DROP POLICY IF EXISTS "Week files are viewable by everyone" ON week_files;
DROP POLICY IF EXISTS "Only admins can upload files" ON week_files;
DROP POLICY IF EXISTS "Only admins can update files" ON week_files;

CREATE POLICY "Anyone can view week files" ON week_files FOR SELECT USING (true);

CREATE POLICY "Admins can upload files" ON week_files FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update files" ON week_files FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Schools policies (fix admin access)
DROP POLICY IF EXISTS "Schools are viewable by everyone" ON schools;
DROP POLICY IF EXISTS "Only admins can create schools" ON schools;
DROP POLICY IF EXISTS "Only admins can update schools" ON schools;

CREATE POLICY "Anyone can view schools" ON schools FOR SELECT USING (true);

CREATE POLICY "Admins can create schools" ON schools FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update schools" ON schools FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 4. FIX ADMIN REQUEST SYSTEM
-- ============================================================================

-- Update admin requests policies
DROP POLICY IF EXISTS "Users can view own admin requests" ON admin_requests;
DROP POLICY IF EXISTS "Users can create admin requests" ON admin_requests;
DROP POLICY IF EXISTS "Admins can update admin requests" ON admin_requests;

CREATE POLICY "Users can view own requests or admins can view all" ON admin_requests FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users can create admin requests" ON admin_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update admin requests" ON admin_requests FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
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

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only existing admins can promote others
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  UPDATE profiles 
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default admin (run once)
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
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Update or insert profile as admin
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (admin_user_id, admin_email, admin_email, 'admin')
  ON CONFLICT (id) 
  DO UPDATE SET role = 'admin', updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. STORAGE POLICIES (if not already set)
-- ============================================================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('week-files', 'week-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for week files
DROP POLICY IF EXISTS "Anyone can view week files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload week files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update week files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete week files" ON storage.objects;

CREATE POLICY "Anyone can view week files" ON storage.objects FOR SELECT 
USING (bucket_id = 'week-files');

CREATE POLICY "Admins can upload week files" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'week-files' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update week files" ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'week-files' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete week files" ON storage.objects FOR DELETE 
USING (
  bucket_id = 'week-files' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 7. REFRESH SCHEMA CACHE AND COMMIT
-- ============================================================================

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- 8. POST-DEPLOYMENT INSTRUCTIONS
-- ============================================================================

-- After running this script, you need to:
-- 1. Create your first admin user by running:
--    SELECT public.create_default_admin('your-admin-email@example.com');
-- 
-- 2. Test the setup by:
--    - Signing up a new user (should auto-create profile)
--    - Logging in as admin and accessing admin features
--    - Uploading content as admin
--
-- 3. If you encounter issues, check:
--    - RLS is enabled on all tables
--    - Storage policies are correctly set
--    - User has proper role in profiles table