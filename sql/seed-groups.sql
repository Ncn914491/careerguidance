-- Seed group memberships for the admin user
-- This should be run after the admin user is created

-- Get the admin user ID (this will need to be updated with the actual admin user ID)
-- For now, we'll use a placeholder that can be replaced when running the script

-- Add admin user to all groups
-- Replace 'ADMIN_USER_ID' with the actual admin user ID when running this script
INSERT INTO group_members (group_id, user_id) 
SELECT g.id, 'ADMIN_USER_ID'
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.group_id = g.id AND gm.user_id = 'ADMIN_USER_ID'
);

-- Insert some sample messages for testing (optional)
-- These can be uncommented and run after the admin user is added to groups
/*
INSERT INTO group_messages (group_id, sender_id, message) VALUES
((SELECT id FROM groups WHERE name = 'General Discussion' LIMIT 1), 'ADMIN_USER_ID', 'Welcome to the Career Guidance Project! Feel free to ask any questions about career opportunities in technology.'),
((SELECT id FROM groups WHERE name = 'Technical Q&A' LIMIT 1), 'ADMIN_USER_ID', 'This is the place to ask technical questions about programming, software development, and engineering concepts.'),
((SELECT id FROM groups WHERE name = 'Project Collaboration' LIMIT 1), 'ADMIN_USER_ID', 'Use this space to collaborate on projects and share your work with fellow participants.'),
((SELECT id FROM groups WHERE name = 'Industry Insights' LIMIT 1), 'ADMIN_USER_ID', 'Let''s discuss the latest trends in technology and career opportunities in various industries.');
*/