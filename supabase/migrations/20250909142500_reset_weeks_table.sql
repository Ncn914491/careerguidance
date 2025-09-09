-- Reset weeks table and prepare for proper data
-- This migration clears existing broken data and ensures proper structure

-- Delete all existing weeks data
DELETE FROM week_files;
DELETE FROM weeks;

-- Reset the auto-generated UUID sequence (weeks table uses UUID, not serial)

-- Ensure weeks table has proper constraints and defaults
ALTER TABLE weeks ALTER COLUMN photos SET DEFAULT '{}';

-- Success message
SELECT 'Weeks table has been reset and is ready for new data!' as status;
