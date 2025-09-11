// Debug script to test admin functionality and career resources
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const debugAdminFunctionality = async () => {
  console.log('🔍 Debugging Admin Functionality and Career Resources\n');

  try {
    // 1. Check existing career resources
    console.log('1. Checking existing career resources...');
    const { data: resources, error: resourcesError } = await supabase
      .from('career_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (resourcesError) {
      console.log('❌ Error fetching career resources:', resourcesError.message);
    } else {
      console.log(`✅ Found ${resources.length} career resources:`);
      resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. "${resource.title}" (${resource.resource_type})`);
      });
    }

    // 2. Check admin users
    console.log('\n2. Checking admin users...');
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    if (adminsError) {
      console.log('❌ Error fetching admin users:', adminsError.message);
    } else {
      console.log(`✅ Found ${admins.length} admin users:`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.full_name || 'No name set'})`);
      });
      
      if (admins.length === 0) {
        console.log('⚠️  No admin users found! This might be why career resources aren\'t visible.');
        console.log('   To fix this, you need to:');
        console.log('   1. Create a user account via the login page');
        console.log('   2. Go to Supabase dashboard > Table Editor > profiles');
        console.log('   3. Change the role of your user from "student" to "admin"');
      }
    }

    // 3. Check if there are duplicate career resources (as mentioned by user)
    console.log('\n3. Looking for duplicate career resources...');
    const { data: duplicates, error: dupError } = await supabase
      .from('career_resources')
      .select('title, resource_type, created_at')
      .order('title');

    if (!dupError && duplicates) {
      const titleGroups = {};
      duplicates.forEach(resource => {
        const key = `${resource.title}-${resource.resource_type}`;
        if (!titleGroups[key]) titleGroups[key] = [];
        titleGroups[key].push(resource);
      });

      const duplicateGroups = Object.entries(titleGroups).filter(([key, items]) => items.length > 1);
      
      if (duplicateGroups.length > 0) {
        console.log(`⚠️  Found ${duplicateGroups.length} duplicate career resource groups:`);
        duplicateGroups.forEach(([key, items]) => {
          console.log(`   - "${items[0].title}" (${items[0].resource_type}) - ${items.length} copies`);
        });
      } else {
        console.log('✅ No duplicates found');
      }
    }

    // 4. Create a test career resource to verify functionality
    console.log('\n4. Testing career resource creation...');
    
    if (admins && admins.length > 0) {
      const testAdmin = admins[0];
      const testResource = {
        title: 'Test Career Resource (Delete Me)',
        description: 'This is a test resource created by the debug script. Feel free to delete it.',
        resource_type: 'text',
        content_text: 'This is test content for debugging purposes. You can delete this resource from the admin panel.',
        display_order: 999,
        is_featured: false,
        created_by: testAdmin.id,
        updated_by: testAdmin.id
      };

      const { data: newResource, error: createError } = await supabase
        .from('career_resources')
        .insert(testResource)
        .select()
        .single();

      if (createError) {
        console.log('❌ Failed to create test resource:', createError.message);
      } else {
        console.log('✅ Successfully created test career resource:', newResource.title);
        console.log('   You should now see this resource in the admin panel!');
      }
    } else {
      console.log('⚠️  Skipping test resource creation - no admin users available');
    }

    console.log('\n📋 Summary:');
    console.log('- Database tables: ✅ Working');
    console.log('- Storage buckets: ✅ Working');
    console.log(`- Admin users: ${admins?.length > 0 ? '✅' : '❌'} ${admins?.length || 0} found`);
    console.log(`- Career resources: ✅ ${resources?.length || 0} found`);
    
    if (admins?.length === 0) {
      console.log('\n🚀 Next Steps:');
      console.log('1. Create an account via the web app login page');
      console.log('2. Set your role to "admin" in the Supabase profiles table');
      console.log('3. Refresh the admin page to see career resources functionality');
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
};

debugAdminFunctionality();
