const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createCareerResourcesTables() {
  console.log('🚀 Creating career resources database tables...\n');

  try {
    // First, let's create some test data to ensure the tables exist
    console.log('1. Testing career_resources table...');
    
    // Try to select from the table - this will tell us if it exists
    const { data: testData, error: testError } = await supabaseAdmin
      .from('career_resources')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('relation "career_resources" does not exist')) {
      console.log('⚠️  Tables do not exist. Please create them manually in Supabase dashboard.');
      console.log('📋 Run these SQL commands in your Supabase SQL editor:');
      console.log(`
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_resources_type ON career_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_career_resources_order ON career_resources(display_order);
CREATE INDEX IF NOT EXISTS idx_career_resources_featured ON career_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_career_resource_files_resource_id ON career_resource_files(career_resource_id);
CREATE INDEX IF NOT EXISTS idx_career_resource_files_type ON career_resource_files(file_type);

-- Enable RLS
ALTER TABLE career_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_resource_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read on career_resources" 
ON career_resources FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public read on career_resource_files" 
ON career_resource_files FOR SELECT 
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
      `);
      return;
    } else if (testError) {
      console.error('❌ Error testing table:', testError);
      return;
    } else {
      console.log('✅ career_resources table exists and is accessible');
    }

    // Test career_resource_files table
    console.log('2. Testing career_resource_files table...');
    const { data: testFilesData, error: testFilesError } = await supabaseAdmin
      .from('career_resource_files')
      .select('id')
      .limit(1);

    if (testFilesError && testFilesError.message.includes('relation "career_resource_files" does not exist')) {
      console.log('❌ career_resource_files table does not exist');
      return;
    } else if (testFilesError) {
      console.error('❌ Error testing files table:', testFilesError);
      return;
    } else {
      console.log('✅ career_resource_files table exists and is accessible');
    }

    console.log('\n🎉 All career resources tables are ready!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createCareerResourcesTables();
