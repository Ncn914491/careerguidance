-- Fix RLS policies for weeks table to allow public read access
-- This allows anyone to view weeks data without authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "weeks_public_read" ON weeks;
DROP POLICY IF EXISTS "weeks_authenticated_read" ON weeks;
DROP POLICY IF EXISTS "weeks_admin_all" ON weeks;
DROP POLICY IF EXISTS "week_files_public_read" ON week_files;
DROP POLICY IF EXISTS "week_files_authenticated_read" ON week_files;
DROP POLICY IF EXISTS "week_files_admin_all" ON week_files;

-- Enable RLS on weeks table
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on week_files table  
ALTER TABLE week_files ENABLE ROW LEVEL SECURITY;

-- Allow public read access to weeks (anyone can view weeks)
CREATE POLICY "weeks_public_read" ON weeks
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to create/update/delete weeks (admins only through application logic)
CREATE POLICY "weeks_authenticated_write" ON weeks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public read access to week_files (anyone can view files)
CREATE POLICY "week_files_public_read" ON week_files
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to create/update/delete week files (admins only through application logic)
CREATE POLICY "week_files_authenticated_write" ON week_files
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
