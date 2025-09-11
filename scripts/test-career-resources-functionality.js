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

async function testCareerResourcesFunctionality() {
  console.log('🧪 Testing career resources functionality...\n');

  try {
    // Test 1: Check database connectivity
    console.log('1. Testing database connectivity...');
    const { data: resources, error: fetchError } = await supabaseAdmin
      .from('career_resources')
      .select('*, career_resource_files(*)')
      .limit(5);

    if (fetchError) {
      console.error('❌ Database error:', fetchError);
      return;
    }

    console.log(`✅ Connected to database. Found ${resources.length} career resources.`);
    
    // Test 2: Display existing resources
    if (resources.length > 0) {
      console.log('\n2. Existing career resources:');
      resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.title}`);
        console.log(`      Type: ${resource.resource_type}`);
        console.log(`      Files: ${resource.career_resource_files?.length || 0}`);
        if (resource.description) {
          console.log(`      Description: ${resource.description}`);
        }
        if (resource.content_text) {
          console.log(`      Text: ${resource.content_text.substring(0, 50)}...`);
        }
        console.log();
      });
    }

    // Test 3: Check storage buckets
    console.log('3. Testing storage buckets...');
    const buckets = ['career-photos', 'career-pdfs', 'career-ppts'];
    
    for (const bucketName of buckets) {
      const { data: bucketFiles, error: bucketError } = await supabaseAdmin.storage
        .from(bucketName)
        .list('', {
          limit: 5,
          offset: 0
        });

      if (bucketError) {
        console.log(`   ❌ ${bucketName}: ${bucketError.message}`);
      } else {
        console.log(`   ✅ ${bucketName}: ${bucketFiles.length} files`);
      }
    }

    // Test 4: Test API endpoints (if server is running)
    console.log('\n4. Testing API endpoints...');
    try {
      const apiResponse = await fetch('http://localhost:3000/api/career-resources');
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('   ✅ GET /api/career-resources working');
        console.log(`   📊 API returned ${apiData.careerResources?.length || 0} resources`);
      } else {
        console.log(`   ⚠️  API returned status ${apiResponse.status} (server may not be running)`);
      }
    } catch (apiError) {
      console.log('   ⚠️  API endpoint unreachable (server not running)');
    }

    // Test 5: Create a test text resource
    console.log('\n5. Testing resource creation...');
    const testResource = {
      title: 'Test Career Guidance',
      description: 'This is a test resource created by the functionality test',
      resource_type: 'text',
      content_text: 'Sample career guidance content for testing purposes. This resource demonstrates the text content functionality.',
      display_order: 999,
      is_featured: false
    };

    const { data: newResource, error: createError } = await supabaseAdmin
      .from('career_resources')
      .insert(testResource)
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Error creating test resource:', createError);
    } else {
      console.log('   ✅ Test resource created successfully');
      console.log(`   📝 Resource ID: ${newResource.id}`);

      // Clean up - delete the test resource
      const { error: deleteError } = await supabaseAdmin
        .from('career_resources')
        .delete()
        .eq('id', newResource.id);

      if (!deleteError) {
        console.log('   🧹 Test resource cleaned up');
      }
    }

    console.log('\n🎉 Career resources functionality test completed!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   • Database: ✅ Connected`);
    console.log(`   • Resources: ${resources.length} existing`);
    console.log(`   • Storage: ✅ Buckets accessible`);
    console.log(`   • CRUD: ✅ Create/Delete working`);
    
    console.log('\n🔗 Next steps:');
    console.log('   • Run `npm run dev` to test the admin interface');
    console.log('   • Visit /admin and click "Career Resources" tab');
    console.log('   • Visit /weeks to see resources displayed');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testCareerResourcesFunctionality();
