-- Migration: Add pending_admin role to profiles table
-- This script updates the existing role constraint to include 'pending_admin'

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with pending_admin role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'admin', 'pending_admin'));

-- Update any existing admin requests to set user role to pending_admin
-- This handles cases where users have pending requests but are still students
UPDATE profiles 
SET role = 'pending_admin' 
WHERE id IN (
  SELECT user_id 
  FROM admin_requests 
  WHERE status = 'pending'
);

-- Create a function to automatically update user role when admin request is created
CREATE OR REPLACE FUNCTION update_user_role_on_admin_request()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new admin request is created, update user role to pending_admin
  IF NEW.status = 'pending' THEN
    UPDATE profiles 
    SET role = 'pending_admin' 
    WHERE id = NEW.user_id AND role = 'student';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user role when admin request is created
DROP TRIGGER IF EXISTS trigger_update_role_on_admin_request ON admin_requests;
CREATE TRIGGER trigger_update_role_on_admin_request
  AFTER INSERT ON admin_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role_on_admin_request();

-- Create a function to handle admin request status changes
CREATE OR REPLACE FUNCTION handle_admin_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When request is approved, set role to admin
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = NEW.user_id;
  
  -- When request is denied, revert role back to student
  ELSIF NEW.status = 'denied' AND OLD.status = 'pending' THEN
    UPDATE profiles 
    SET role = 'student' 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle admin request status changes
DROP TRIGGER IF EXISTS trigger_handle_admin_request_status_change ON admin_requests;
CREATE TRIGGER trigger_handle_admin_request_status_change
  AFTER UPDATE ON admin_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_request_status_change();