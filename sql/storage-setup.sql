-- Storage bucket setup for Career Guidance Project
-- This file sets up the storage bucket and policies for file uploads

-- Create storage bucket for week files
INSERT INTO storage.buckets (id, name, public)
VALUES ('week-files', 'week-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for week-files bucket

-- Allow public read access to all files
CREATE POLICY "Public read access for week files" ON storage.objects
FOR SELECT USING (bucket_id = 'week-files');

-- Allow authenticated users to upload files (will be restricted by application logic)
CREATE POLICY "Authenticated users can upload week files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'week-files' 
  AND auth.uid() IS NOT NULL
);

-- Allow file owners and admins to delete files
CREATE POLICY "File owners and admins can delete week files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'week-files' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Allow file owners and admins to update files
CREATE POLICY "File owners and admins can update week files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'week-files' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);