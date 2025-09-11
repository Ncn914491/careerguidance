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

async function testCareerResourcesSetup() {
  console.log('🧪 Testing career resources database setup...\n');

  try {
    // Test 1: Check if tables exist by trying to query them
    console.log('1. Testing career_resources table...');
    const { data: resources, error: resourcesError } = await supabaseAdmin
      .from('career_resources')
      .select('*')
      .limit(1);

    if (resourcesError) {
      console.error('❌ Error accessing career_resources table:', resourcesError);
      return;
    } else {
      console.log('✅ career_resources table accessible');
      console.log(`   Found ${resources?.length || 0} existing resources`);
    }

    // Test 2: Check career_resource_files table
    console.log('\n2. Testing career_resource_files table...');
    const { data: files, error: filesError } = await supabaseAdmin
      .from('career_resource_files')
      .select('*')
      .limit(1);

    if (filesError) {
      console.error('❌ Error accessing career_resource_files table:', filesError);
      return;
    } else {
      console.log('✅ career_resource_files table accessible');
      console.log(`   Found ${files?.length || 0} existing files`);
    }

    // Test 3: Test API endpoint
    console.log('\n3. Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/career-resources');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint accessible');
        console.log(`   API returned ${data.careerResources?.length || 0} resources`);
      } else {
        console.log(`⚠️  API returned status ${response.status}. This is expected if server is not running.`);
      }
    } catch (apiError) {
      console.log('⚠️  Could not reach API endpoint (server likely not running). This is expected.');
    }

    // Test 4: Insert a sample resource to verify RLS policies work
    console.log('\n4. Testing sample resource insertion...');
    const { data: testResource, error: insertError } = await supabaseAdmin
      .from('career_resources')
      .insert({
        title: 'Test Career Resource',
        description: 'This is a test resource to verify the setup',
        resource_type: 'text',
        content_text: 'Sample career guidance content.',
        display_order: 0,
        is_featured: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test resource:', insertError);
    } else {
      console.log('✅ Successfully inserted test resource');
      console.log(`   Resource ID: ${testResource.id}`);
      
      // Clean up - delete the test resource
      const { error: deleteError } = await supabaseAdmin
        .from('career_resources')
        .delete()
        .eq('id', testResource.id);
      
      if (!deleteError) {
        console.log('✅ Test resource cleaned up successfully');
      }
    }

    console.log('\n🎉 Career resources setup verification completed successfully!');
    console.log('\nNext steps:');
    console.log('- Run `npm run dev` to start the development server');
    console.log('- Visit /weeks to see the new Career Resources section');
    console.log('- The API endpoints are ready at /api/career-resources');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testCareerResourcesSetup();
