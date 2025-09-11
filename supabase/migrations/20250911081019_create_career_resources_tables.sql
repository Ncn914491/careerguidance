-- Create career_resources table
CREATE TABLE IF NOT EXISTS career_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('photo', 'pdf', 'ppt', 'text')),
  content_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create career_resource_files table
CREATE TABLE IF NOT EXISTS career_resource_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  career_resource_id UUID REFERENCES career_resources(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('photo', 'pdf', 'ppt')),
  file_url TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_career_resources_type ON career_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_career_resources_order ON career_resources(display_order);
CREATE INDEX IF NOT EXISTS idx_career_resources_featured ON career_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_career_resource_files_resource_id ON career_resource_files(career_resource_id);
CREATE INDEX IF NOT EXISTS idx_career_resource_files_type ON career_resource_files(file_type);

-- Enable RLS
ALTER TABLE career_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_resource_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for career_resources
CREATE POLICY "Allow public read on career_resources" 
ON career_resources FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow admin insert on career_resources" 
ON career_resources FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin update on career_resources" 
ON career_resources FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin delete on career_resources" 
ON career_resources FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create RLS policies for career_resource_files
CREATE POLICY "Allow public read on career_resource_files" 
ON career_resource_files FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow admin insert on career_resource_files" 
ON career_resource_files FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin update on career_resource_files" 
ON career_resource_files FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin delete on career_resource_files" 
ON career_resource_files FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
