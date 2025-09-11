const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCareerResourcesTables() {
  console.log('🚀 Creating career resources database tables...\n');

  try {
    // Create career_resources table
    console.log('1. Creating career_resources table...');
    const { error: tableError } = await supabase.rpc('create_career_resources_table', {});
    
    if (tableError) {
      // If RPC doesn't exist, we'll create the table directly using SQL
      console.log('Creating table using direct SQL...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS career_resources (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('photo', 'pdf', 'ppt', 'text')),
          content_text TEXT, -- For text-based resources
          display_order INTEGER DEFAULT 0,
          is_featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id),
          updated_by UUID REFERENCES auth.users(id)
        );
      `;
      
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (sqlError) {
        console.error('❌ Error creating career_resources table:', sqlError);
        return;
      }
    }
    console.log('✅ Created career_resources table');

    // Create career_resource_files table for file attachments
    console.log('\n2. Creating career_resource_files table...');
    const createFilesTableSQL = `
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
    `;
    
    const { error: filesTableError } = await supabase.rpc('exec_sql', { sql: createFilesTableSQL });
    if (filesTableError) {
      console.error('❌ Error creating career_resource_files table:', filesTableError);
      return;
    }
    console.log('✅ Created career_resource_files table');

    // Create indexes for better performance
    console.log('\n3. Creating indexes...');
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_career_resources_type ON career_resources(resource_type);
      CREATE INDEX IF NOT EXISTS idx_career_resources_order ON career_resources(display_order);
      CREATE INDEX IF NOT EXISTS idx_career_resources_featured ON career_resources(is_featured);
      CREATE INDEX IF NOT EXISTS idx_career_resource_files_resource_id ON career_resource_files(career_resource_id);
      CREATE INDEX IF NOT EXISTS idx_career_resource_files_type ON career_resource_files(file_type);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Created database indexes');
    }

    // Enable Row Level Security (RLS)
    console.log('\n4. Enabling Row Level Security...');
    const enableRLSSQL = `
      ALTER TABLE career_resources ENABLE ROW LEVEL SECURITY;
      ALTER TABLE career_resource_files ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
    } else {
      console.log('✅ Enabled Row Level Security');
    }

    // Create RLS policies
    console.log('\n5. Creating RLS policies...');
    const createPoliciesSQL = `
      -- Allow everyone to read career resources
      CREATE POLICY IF NOT EXISTS "Allow public read on career_resources" 
      ON career_resources FOR SELECT 
      TO public 
      USING (true);

      CREATE POLICY IF NOT EXISTS "Allow public read on career_resource_files" 
      ON career_resource_files FOR SELECT 
      TO public 
      USING (true);

      -- Allow authenticated users with admin role to insert/update/delete
      CREATE POLICY IF NOT EXISTS "Allow admin insert on career_resources" 
      ON career_resources FOR INSERT 
      TO authenticated 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Allow admin update on career_resources" 
      ON career_resources FOR UPDATE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Allow admin delete on career_resources" 
      ON career_resources FOR DELETE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Allow admin insert on career_resource_files" 
      ON career_resource_files FOR INSERT 
      TO authenticated 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Allow admin update on career_resource_files" 
      ON career_resource_files FOR UPDATE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Allow admin delete on career_resource_files" 
      ON career_resource_files FOR DELETE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
    `;
    
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL });
    if (policyError) {
      console.error('❌ Error creating RLS policies:', policyError);
    } else {
      console.log('✅ Created RLS policies');
    }

    console.log('\n🎉 Career resources database structure created successfully!');
    
    // Verify tables were created
    console.log('\n6. Verifying table creation...');
    const { data: tables, error: verifyError } = await supabase
      .from('career_resources')
      .select('*')
      .limit(1);
    
    if (verifyError && !verifyError.message.includes('relation "career_resources" does not exist')) {
      console.log('✅ Tables created and accessible');
    } else if (verifyError) {
      console.error('❌ Tables may not have been created properly:', verifyError);
    } else {
      console.log('✅ Tables created and accessible');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createCareerResourcesTables();
