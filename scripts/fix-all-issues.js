#!/usr/bin/env node

/**
 * Comprehensive fix script for Career Guidance Project
 * Addresses: Schema mismatch, RLS policies, weeks data, auth issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

async function verifySchema() {
  console.log('🔍 Verifying database schema...');
  
  const requiredTables = ['profiles', 'weeks', 'week_files', 'groups', 'group_members', 'group_messages'];
  const missingTables = [];
  
  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    if (!exists) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    console.log('❌ Missing tables:', missingTables.join(', '));
    return false;
  }
  
  console.log('✅ All required tables exist');
  return true;
}

async function checkWeeksData() {
  console.log('🔍 Checking weeks data...');
  try {
    const { data: weeks, error } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number');
    
    if (error) throw error;
    
    console.log(`📊 Found ${weeks.length} weeks in database`);
    return weeks;
  } catch (error) {
    console.error('❌ Error checking weeks data:', error.message);
    return [];
  }
}

async function seedSampleWeeks() {
  console.log('🌱 Seeding sample weeks data...');
  
  const sampleWeeks = [
    {
      week_number: 1,
      title: 'Introduction to Career Guidance',
      description: 'Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning.'
    },
    {
      week_number: 2,
      title: 'Self-Assessment and Skills Identification',
      description: 'Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration.'
    },
    {
      week_number: 3,
      title: 'Industry Exploration and Market Trends',
      description: 'Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities.'
    },
    {
      week_number: 4,
      title: 'Resume Building and Interview Preparation',
      description: 'Creating effective resumes and cover letters. Interview techniques and professional communication skills.'
    },
    {
      week_number: 5,
      title: 'Networking and Professional Development',
      description: 'Building professional networks and continuous learning. Strategies for career advancement and professional growth.'
    }
  ];
  
  try {
    // Check if weeks already exist
    const { data: existingWeeks } = await supabase
      .from('weeks')
      .select('week_number');
    
    const existingNumbers = existingWeeks?.map(w => w.week_number) || [];
    
    for (const week of sampleWeeks) {
      if (!existingNumbers.includes(week.week_number)) {
        const { error } = await supabase
          .from('weeks')
          .insert(week);
        
        if (error) {
          console.error(`❌ Error inserting week ${week.week_number}:`, error.message);
        } else {
          console.log(`✅ Inserted Week ${week.week_number}: ${week.title}`);
        }
      } else {
        console.log(`⏭️  Week ${week.week_number} already exists, skipping`);
      }
    }
    
    console.log('✅ Sample weeks seeding completed');
  } catch (error) {
    console.error('❌ Error seeding weeks:', error.message);
  }
}

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies...');
  
  const policies = [
    // Drop existing policies that might be causing issues
    `DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON profiles;`,
    `DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;`,
    `DROP POLICY IF EXISTS "System can insert profiles" ON profiles;`,
    `DROP POLICY IF EXISTS "Weeks are viewable by everyone" ON weeks;`,
    `DROP POLICY IF EXISTS "Only admins can create weeks" ON weeks;`,
    `DROP POLICY IF EXISTS "Week files are viewable by everyone" ON week_files;`,
    `DROP POLICY IF EXISTS "Only admins can upload files" ON week_files;`,
    
    // Create new, working policies
    `CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);`,
    `CREATE POLICY "Enable insert for authenticated users only" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
    `CREATE POLICY "Enable update for users based on id" ON profiles FOR UPDATE USING (auth.uid() = id);`,
    
    `CREATE POLICY "Enable read access for all users" ON weeks FOR SELECT USING (true);`,
    `CREATE POLICY "Enable insert for admin users only" ON weeks FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );`,
    `CREATE POLICY "Enable update for admin users only" ON weeks FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );`,
    `CREATE POLICY "Enable delete for admin users only" ON weeks FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );`,
    
    `CREATE POLICY "Enable read access for all users" ON week_files FOR SELECT USING (true);`,
    `CREATE POLICY "Enable insert for admin users only" ON week_files FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );`,
    `CREATE POLICY "Enable update for admin users only" ON week_files FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );`,
    `CREATE POLICY "Enable delete for admin users only" ON week_files FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );`,
  ];
  
  try {
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error && !error.message.includes('does not exist')) {
        console.error('❌ Policy error:', error.message);
      }
    }
    console.log('✅ RLS policies updated');
  } catch (error) {
    console.error('❌ Error updating RLS policies:', error.message);
  }
}

async function createStorageBucket() {
  console.log('🗂️  Setting up storage bucket...');
  
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'week-files');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('week-files', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });
      
      if (error) {
        console.error('❌ Error creating storage bucket:', error.message);
      } else {
        console.log('✅ Storage bucket created');
      }
    } else {
      console.log('✅ Storage bucket already exists');
    }
  } catch (error) {
    console.error('❌ Error setting up storage:', error.message);
  }
}

async function checkAdminUser() {
  console.log('👤 Checking admin user...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    
    if (error) throw error;
    
    console.log(`👥 Found ${profiles.length} admin user(s)`);
    
    if (profiles.length === 0) {
      console.log('⚠️  No admin users found. You may need to create one manually.');
    }
    
    return profiles;
  } catch (error) {
    console.error('❌ Error checking admin users:', error.message);
    return [];
  }
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API endpoints...');
  
  try {
    // Test weeks endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('supabase.co', 'supabase.co')}/rest/v1/weeks?select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Weeks API working - ${data.length} weeks found`);
    } else {
      console.error('❌ Weeks API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive fix for Career Guidance Project\n');
  
  // Step 1: Check database connection
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Step 2: Verify schema
  const schemaValid = await verifySchema();
  if (!schemaValid) {
    console.error('❌ Schema issues detected. Please run the init.sql script first.');
    process.exit(1);
  }
  
  // Step 3: Fix RLS policies
  await fixRLSPolicies();
  
  // Step 4: Set up storage
  await createStorageBucket();
  
  // Step 5: Check weeks data
  const weeks = await checkWeeksData();
  if (weeks.length === 0) {
    await seedSampleWeeks();
  }
  
  // Step 6: Check admin users
  await checkAdminUser();
  
  // Step 7: Test API endpoints
  await testAPIEndpoints();
  
  console.log('\n🎉 Fix script completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the weeks page: http://localhost:3000/weeks');
  console.log('2. Test the groups page: http://localhost:3000/groups');
  console.log('3. Test admin functionality: http://localhost:3000/admin');
  console.log('4. Check that authentication works properly');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});