-- Clean initialization script for Career Guidance Project
-- This creates all tables and policies from scratch

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS ai_chats CASCADE;
DROP TABLE IF EXISTS admin_requests CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS week_files CASCADE;
DROP TABLE IF EXISTS weeks CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- User profiles with role-based access
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'pending_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools visited during the program
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  visit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members information
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly content organization
CREATE TABLE weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files associated with weeks
CREATE TABLE week_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('photo', 'video', 'pdf')),
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group chat functionality
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group membership
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group messages with real-time support
CREATE TABLE group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI chat conversations with auto-expiry
CREATE TABLE ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Admin role requests
CREATE TABLE admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row-Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

-- Row-Level Security Policies

-- Profiles: Public read, users can update their own
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users based on id" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Schools: Public read, admin write
CREATE POLICY "Enable read access for all users" ON schools FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin users only" ON schools FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable update for admin users only" ON schools FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Team members: Public read, admin write
CREATE POLICY "Enable read access for all users" ON team_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin users only" ON team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable update for admin users only" ON team_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Weeks: Public read, admin write
CREATE POLICY "Enable read access for all users" ON weeks FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin users only" ON weeks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable update for admin users only" ON weeks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable delete for admin users only" ON weeks FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Week files: Public read, admin write
CREATE POLICY "Enable read access for all users" ON week_files FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin users only" ON week_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable update for admin users only" ON week_files FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable delete for admin users only" ON week_files FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Groups: Public read, authenticated users can create
CREATE POLICY "Enable read access for all users" ON groups FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for group creators and admins" ON groups FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable delete for group creators and admins" ON groups FOR DELETE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Group members: Members can read, authenticated users can join
CREATE POLICY "Enable read access for all users" ON group_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON group_members FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
CREATE POLICY "Enable delete for users and admins" ON group_members FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Group messages: Members can read and send
CREATE POLICY "Enable read for group members" ON group_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable insert for group members" ON group_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()) AND
  sender_id = auth.uid()
);

-- AI chats: Users can only access their own
CREATE POLICY "Enable read for own chats" ON ai_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own chats" ON ai_chats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin requests: Users can create and view their own, admins can view all
CREATE POLICY "Enable read for own requests and admins" ON admin_requests FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable insert for authenticated users" ON admin_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for admins" ON admin_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_weeks_week_number ON weeks(week_number);
CREATE INDEX idx_week_files_week_id ON week_files(week_id);
CREATE INDEX idx_week_files_type ON week_files(file_type);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX idx_group_messages_created_at ON group_messages(created_at);
CREATE INDEX idx_ai_chats_user_id ON ai_chats(user_id);
CREATE INDEX idx_ai_chats_expires_at ON ai_chats(expires_at);
CREATE INDEX idx_admin_requests_user_id ON admin_requests(user_id);
CREATE INDEX idx_admin_requests_status ON admin_requests(status);

-- Create function to automatically clean up expired AI chats
CREATE OR REPLACE FUNCTION cleanup_expired_ai_chats()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_chats WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert sample schools
INSERT INTO schools (name, location, visit_date) VALUES
('Tech High School', 'Downtown', '2024-01-15'),
('Science Academy', 'Midtown', '2024-01-22'),
('Engineering College', 'University District', '2024-02-05'),
('Business Institute', 'Financial District', '2024-02-12'),
('Arts & Design School', 'Creative Quarter', '2024-02-19');

-- Insert sample team members
INSERT INTO team_members (name, roll_number, position) VALUES
('Alice Johnson', 'TM001', 'Team Lead'),
('Bob Smith', 'TM002', 'Technical Coordinator'),
('Carol Davis', 'TM003', 'Content Specialist'),
('David Wilson', 'TM004', 'Outreach Coordinator'),
('Eva Brown', 'TM005', 'Data Analyst'),
('Frank Miller', 'TM006', 'Presentation Specialist'),
('Grace Lee', 'TM007', 'Research Assistant'),
('Henry Taylor', 'TM008', 'Technical Support'),
('Ivy Chen', 'TM009', 'Communications Lead'),
('Jack Anderson', 'TM010', 'Project Manager'),
('Kate Thompson', 'TM011', 'Quality Assurance');

-- Insert sample weeks
INSERT INTO weeks (week_number, title, description) VALUES
(1, 'Introduction to Career Guidance', 'Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning.'),
(2, 'Self-Assessment and Skills Identification', 'Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration.'),
(3, 'Industry Exploration and Market Trends', 'Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities.'),
(4, 'Resume Building and Interview Preparation', 'Creating effective resumes and cover letters. Interview techniques and professional communication skills.'),
(5, 'Networking and Professional Development', 'Building professional networks and continuous learning. Strategies for career advancement and professional growth.');

-- Insert sample groups
INSERT INTO groups (name, description) VALUES
('General Discussion', 'A place for general discussions about career guidance and opportunities.'),
('Technical Q&A', 'Ask and answer technical questions related to your field of interest.'),
('Interview Experiences', 'Share your interview experiences and learn from others.'),
('Industry Insights', 'Discuss various industries and share insights about career opportunities.'),
('Study Group', 'Collaborate on learning materials and support each other in skill development.');

-- Success message
SELECT 'Database schema and sample data created successfully!' as status;