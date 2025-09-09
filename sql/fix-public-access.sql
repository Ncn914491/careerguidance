-- Fix RLS policies for public access to weeks and proper authentication flow
-- This script addresses the infinite loading issue by making weeks publicly viewable

-- ============================================================================
-- WEEKS TABLE - MAKE PUBLICLY ACCESSIBLE (NO LOGIN REQUIRED)
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Weeks are viewable by everyone" ON weeks;
DROP POLICY IF EXISTS "Authenticated users can read weeks" ON weeks;
DROP POLICY IF EXISTS "Only admins can create weeks" ON weeks;
DROP POLICY IF EXISTS "Only admins can update weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can create weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can update weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can delete weeks" ON weeks;

-- Allow everyone to view weeks (no authentication required)
CREATE POLICY "Everyone can view weeks" ON weeks 
FOR SELECT USING (true);

-- Only admins can create weeks
CREATE POLICY "Only admins can create weeks" ON weeks 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update weeks
CREATE POLICY "Only admins can update weeks" ON weeks 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete weeks
CREATE POLICY "Only admins can delete weeks" ON weeks 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- WEEK_FILES TABLE - MAKE PUBLICLY ACCESSIBLE (NO LOGIN REQUIRED)  
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Week files are viewable by everyone" ON week_files;
DROP POLICY IF EXISTS "Authenticated users can read week files" ON week_files;
DROP POLICY IF EXISTS "Only admins can upload files" ON week_files;
DROP POLICY IF EXISTS "Only admins can update files" ON week_files;
DROP POLICY IF EXISTS "Admins can upload week files" ON week_files;
DROP POLICY IF EXISTS "Admins can update week files" ON week_files;
DROP POLICY IF EXISTS "Admins can delete week files" ON week_files;

-- Allow everyone to view week files (no authentication required)
CREATE POLICY "Everyone can view week files" ON week_files 
FOR SELECT USING (true);

-- Only admins can upload week files
CREATE POLICY "Only admins can upload week files" ON week_files 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update week files
CREATE POLICY "Only admins can update week files" ON week_files 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete week files
CREATE POLICY "Only admins can delete week files" ON week_files 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUPS TABLE - ALLOW AUTHENTICATED USERS TO VIEW ALL GROUPS
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Everyone can view groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can read groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;
DROP POLICY IF EXISTS "Only admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Only admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;

-- Allow authenticated users to view all groups (needed to show group list)
CREATE POLICY "Authenticated users can view all groups" ON groups 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create groups
CREATE POLICY "Authenticated users can create groups" ON groups 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update groups
CREATE POLICY "Only admins can update groups" ON groups 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete groups
CREATE POLICY "Only admins can delete groups" ON groups 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- GROUP_MEMBERS TABLE - FIX MEMBERSHIP POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can read memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Students can join groups" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can manage" ON group_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON group_members;
DROP POLICY IF EXISTS "Admins can update memberships" ON group_members;

-- Allow authenticated users to view all group memberships (needed for member counts)
CREATE POLICY "Authenticated users can view memberships" ON group_members 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to join groups (insert their own membership)
CREATE POLICY "Users can join groups" ON group_members 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- Allow users to leave groups or admins to manage memberships
CREATE POLICY "Users can leave or admins can manage" ON group_members 
FOR DELETE USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- PROFILES TABLE - ENSURE PROPER ACCESS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Allow everyone to view profiles (needed for displaying user names)
CREATE POLICY "Everyone can view profiles" ON profiles 
FOR SELECT USING (true);

-- Users can insert their own profile or system can insert
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- INSERT SAMPLE DATA IF NOT EXISTS
-- ============================================================================

-- Insert admin user profile if not exists
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  '12345678-1234-1234-1234-123456789012'::uuid,
  'nchaitanyanaidu@yahoo.com',
  'System Administrator',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'nchaitanyanaidu@yahoo.com'
);

-- Insert sample weeks data if not exists
INSERT INTO weeks (week_number, title, description, created_at) VALUES
(1, 'Introduction to Career Guidance', 'Welcome to our career guidance program. This week focuses on understanding various career paths and opportunities.', NOW()),
(2, 'Technical Skills Development', 'Learn about essential technical skills required in modern workplaces and how to develop them effectively.', NOW()),
(3, 'Communication and Soft Skills', 'Develop your communication skills, teamwork abilities, and other soft skills crucial for career success.', NOW()),
(4, 'Industry Exposure and Networking', 'Understand different industries, their requirements, and learn the importance of professional networking.', NOW()),
(5, 'Interview Preparation and Resume Building', 'Master the art of creating compelling resumes and ace job interviews with confidence.', NOW())
ON CONFLICT (week_number) DO NOTHING;

-- Insert sample groups if not exists
INSERT INTO groups (name, description, created_at) VALUES
('General Discussion', 'A place for general discussions about career guidance and opportunities.', NOW()),
('Technical Q&A', 'Ask and answer technical questions related to your field of interest.', NOW()),
('Interview Experiences', 'Share your interview experiences and learn from others.', NOW()),
('Industry Insights', 'Discuss various industries and share insights about career opportunities.', NOW()),
('Study Group', 'Collaborate on learning materials and support each other in skill development.', NOW())
ON CONFLICT (name) DO NOTHING;
