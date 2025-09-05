-- Initial data seeding for Career Guidance Project
-- This file contains sample data to populate the database for testing and initial setup

-- Insert team members (11 members as specified in requirements)
INSERT INTO team_members (name, roll_number, position) VALUES
('Chaitanya Naidu', 'CSE001', 'Project Lead'),
('Arjun Sharma', 'CSE002', 'Frontend Developer'),
('Priya Patel', 'CSE003', 'Backend Developer'),
('Rahul Kumar', 'CSE004', 'UI/UX Designer'),
('Sneha Reddy', 'CSE005', 'Database Administrator'),
('Vikram Singh', 'CSE006', 'Full Stack Developer'),
('Ananya Gupta', 'CSE007', 'Quality Assurance'),
('Karthik Rao', 'CSE008', 'DevOps Engineer'),
('Meera Nair', 'CSE009', 'Content Manager'),
('Rohan Joshi', 'CSE010', 'Technical Writer'),
('Divya Krishnan', 'CSE011', 'Project Coordinator');

-- Insert sample schools (5+ schools as specified in requirements)
INSERT INTO schools (name, location, visit_date) VALUES
('Synergy School of Excellence', 'Hyderabad', '2024-01-15'),
('Greenwood High School', 'Bangalore', '2024-01-22'),
('Delhi Public School', 'Delhi', '2024-02-05'),
('Kendriya Vidyalaya', 'Chennai', '2024-02-12'),
('St. Mary''s Convent School', 'Mumbai', '2024-02-19'),
('DAV Public School', 'Pune', '2024-02-26'),
('Ryan International School', 'Kolkata', '2024-03-05');

-- Insert sample weeks for content organization
INSERT INTO weeks (week_number, title, description) VALUES
(1, 'Introduction to Career Guidance', 'Overview of career opportunities in technology and engineering fields'),
(2, 'Computer Science Fundamentals', 'Basic concepts of programming and software development'),
(3, 'Engineering Disciplines', 'Exploring different engineering branches and their applications'),
(4, 'Industry Insights', 'Guest lectures from industry professionals and career paths'),
(5, 'Project Showcase', 'Student presentations and project demonstrations');

-- Insert sample groups for chat functionality
INSERT INTO groups (name, description) VALUES
('General Discussion', 'Main group for all participants to discuss career guidance topics'),
('Technical Q&A', 'Group focused on technical questions and programming help'),
('Project Collaboration', 'Space for students to collaborate on projects and assignments'),
('Industry Insights', 'Discussions about industry trends and career opportunities');

-- Note: User profiles and group memberships will be created when users sign up
-- The admin user will be seeded separately through the authentication setup process

-- Create a cleanup job for expired AI chats (optional, can be run periodically)
-- This would typically be set up as a cron job or scheduled function
-- SELECT cleanup_expired_ai_chats();