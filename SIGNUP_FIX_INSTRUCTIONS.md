# Signup and RLS Fix Instructions

## Issues Fixed
1. **Email verification requirement** - Users were stuck waiting for email confirmation
2. **RLS policy errors** - Groups and other features were blocked by restrictive policies
3. **Profile creation issues** - Users couldn't access features due to missing profiles

## Manual Steps to Complete the Fix

### 1. Disable Email Confirmation in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Settings**
3. Under **Email Auth** section
4. **Disable** "Enable email confirmations"
5. Click **Save**

### 2. Apply Database Fixes

Copy and paste the following SQL into your Supabase SQL Editor and run it:

```sql
-- COMPREHENSIVE FIX FOR SIGNUP AND RLS ISSUES

BEGIN;

-- Clean up existing problematic policies
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

-- Drop existing trigger and function safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create/update profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create permissive RLS policies for profiles
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create permissive RLS policies for groups
CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Group creators and admins can update groups" ON groups FOR UPDATE 
USING (
  auth.uid() = created_by 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Create permissive RLS policies for group members
CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join groups" ON group_members FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can manage their own membership" ON group_members FOR DELETE 
USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Create permissive RLS policies for group messages
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

-- Create helper functions
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

-- Create default groups
INSERT INTO groups (id, name, description, created_by) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'General Discussion', 'General chat for all students', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Study Group', 'Academic discussions and study materials', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Career Guidance', 'Career advice and opportunities', NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

### 3. Set Up Admin User

After applying the database fixes, run this SQL to make your account an admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'nchaitanyanaidu@yahoo.com';
```

### 4. Test the Application

1. **Test Signup Flow:**
   - Go to the login page
   - Click "Sign Up"
   - Enter email, password, and name
   - Should redirect immediately without email verification

2. **Test Group Access:**
   - After signing up, navigate to groups
   - Should be able to view and join groups without errors

3. **Test Admin Features:**
   - Sign in with the admin account (nchaitanyanaidu@yahoo.com)
   - Should have access to admin dashboard and features

## What Was Fixed

### Code Changes Made:
1. **AuthProvider.tsx** - Removed email confirmation requirement
2. **LoginPage.tsx** - Updated signup flow to redirect immediately
3. **profile-utils.ts** - Added utility functions for profile management

### Database Changes Applied:
1. **Permissive RLS Policies** - Allow users to access groups and profiles
2. **Automatic Profile Creation** - Trigger creates profiles on signup
3. **Default Groups** - Pre-created groups for all users to join
4. **Helper Functions** - Utilities for profile and admin management

## Troubleshooting

If you still encounter issues:

1. **Check Supabase Logs** - Look for RLS policy violations
2. **Verify Email Confirmation is Disabled** - In Authentication settings
3. **Check Profile Creation** - Ensure profiles table has entries for users
4. **Test with Fresh Account** - Try signing up with a new email

The application should now work without email verification and users should be able to access all features including groups.