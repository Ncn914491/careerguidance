require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const setupCareerResources = async () => {
  try {
    console.log('Setting up career resources database tables and storage...\n');

    // Check if tables exist
    console.log('1. Checking if career resources tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('career_resources')
      .select('count')
      .limit(1);

    if (tablesError) {
      console.log('Tables do not exist yet. This is expected for first-time setup.');
      console.log('Please run the database migration first:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Run the SQL from: supabase/migrations/20250911081019_create_career_resources_tables.sql');
      console.log('3. Run the SQL from: sql/career-resources-storage.sql');
      console.log('4. Then run this script again.\n');
    } else {
      console.log('✅ Career resources table exists\n');
    }

    // Check storage buckets
    console.log('2. Checking storage buckets...');
    const buckets = ['career-photos', 'career-pdfs', 'career-ppts'];
    for (const bucketName of buckets) {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error || !data) {
        console.log(`❌ Bucket "${bucketName}" does not exist`);
      } else {
        console.log(`✅ Bucket "${bucketName}" exists`);
      }
    }

    console.log('\n3. Testing API endpoints...');
    
    // Test the GET endpoint
    console.log('Testing GET /api/career-resources...');
    const response = await fetch(`${supabaseUrl.replace('/supabase', '')}/api/career-resources`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API working - found ${data.careerResources?.length || 0} career resources`);
    } else {
      console.log(`❌ API test failed - Status: ${response.status}`);
    }

    console.log('\n🎉 Career resources setup check completed!');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  }
};

setupCareerResources();
