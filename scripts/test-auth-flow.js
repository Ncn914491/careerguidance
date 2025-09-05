#!/usr/bin/env node

/**
 * Test authentication flow
 * This script tests if the signup and login flow works correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Check if groups are accessible
    console.log('\n📋 Test 1: Checking groups access...');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .limit(5);

    if (groupsError) {
      console.log('❌ Groups access failed:', groupsError.message);
    } else {
      console.log(`✅ Groups accessible: ${groups?.length || 0} groups found`);
      if (groups && groups.length > 0) {
        console.log('   Sample groups:', groups.map(g => g.name).join(', '));
      }
    }

    // Test 2: Check if profiles table is accessible
    console.log('\n📋 Test 2: Checking profiles access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, role')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles access failed:', profilesError.message);
    } else {
      console.log(`✅ Profiles accessible: ${profiles?.length || 0} profiles found`);
    }

    // Test 3: Check admin user exists
    console.log('\n📋 Test 3: Checking admin user...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('email', 'nchaitanyanaidu@yahoo.com')
      .single();

    if (adminError) {
      console.log('⚠️  Admin user not found or not accessible');
      console.log('   You may need to sign up with the admin email first');
    } else {
      console.log(`✅ Admin user found: ${adminProfile.email} (${adminProfile.role})`);
    }

    // Test 4: Test signup flow (without actually creating a user)
    console.log('\n📋 Test 4: Testing signup validation...');
    const testEmail = 'test-' + Date.now() + '@example.com';
    
    // This should fail with "weak password" or similar, not RLS errors
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: '123', // Intentionally weak password
    });

    if (signupError) {
      if (signupError.message.includes('Password should be at least')) {
        console.log('✅ Signup validation working (password requirements)');
      } else if (signupError.message.includes('RLS') || signupError.message.includes('policy')) {
        console.log('❌ Signup blocked by RLS policies:', signupError.message);
      } else {
        console.log('⚠️  Signup error (may be normal):', signupError.message);
      }
    } else {
      console.log('✅ Signup flow accessible');
      // Clean up test user if created
      if (signupData.user) {
        console.log('   (Test user created, should be cleaned up manually)');
      }
    }

    console.log('\n🎉 Authentication flow test completed!');
    console.log('\n📋 Summary:');
    console.log('- If groups and profiles are accessible: ✅ RLS policies fixed');
    console.log('- If admin user exists: ✅ Admin setup complete');
    console.log('- If signup validation works: ✅ Auth flow ready');
    console.log('\nNext: Test the actual signup flow in your browser');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testAuthFlow().catch(console.error);