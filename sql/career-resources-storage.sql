-- Career Resources Storage Setup
-- Create storage buckets for career resources

-- Create career-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-photos', 'career-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create career-pdfs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-pdfs', 'career-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create career-ppts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-ppts', 'career-ppts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for career-photos bucket

-- Allow public read access to career photos
CREATE POLICY "Public read access for career photos" ON storage.objects
FOR SELECT USING (bucket_id = 'career-photos');

-- Allow admins to upload career photos
CREATE POLICY "Admins can upload career photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'career-photos' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to delete career photos
CREATE POLICY "Admins can delete career photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'career-photos' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to update career photos
CREATE POLICY "Admins can update career photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'career-photos' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage policies for career-pdfs bucket

-- Allow public read access to career PDFs
CREATE POLICY "Public read access for career pdfs" ON storage.objects
FOR SELECT USING (bucket_id = 'career-pdfs');

-- Allow admins to upload career PDFs
CREATE POLICY "Admins can upload career pdfs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'career-pdfs' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to delete career PDFs
CREATE POLICY "Admins can delete career pdfs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'career-pdfs' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to update career PDFs
CREATE POLICY "Admins can update career pdfs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'career-pdfs' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage policies for career-ppts bucket

-- Allow public read access to career PPTs
CREATE POLICY "Public read access for career ppts" ON storage.objects
FOR SELECT USING (bucket_id = 'career-ppts');

-- Allow admins to upload career PPTs
CREATE POLICY "Admins can upload career ppts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'career-ppts' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to delete career PPTs
CREATE POLICY "Admins can delete career ppts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'career-ppts' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to update career PPTs
CREATE POLICY "Admins can update career ppts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'career-ppts' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
