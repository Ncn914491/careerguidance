#!/usr/bin/env node

/**
 * Test script to verify all fixes are working
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create client with anon key (like frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWeeksAPI() {
  console.log('🧪 Testing weeks API...');
  
  try {
    const { data: weeks, error } = await supabase
      .from('weeks')
      .select(`
        *,
        week_files (*)
      `)
      .order('week_number', { ascending: true });

    if (error) {
      console.error('❌ Weeks API error:', error);
      return false;
    }

    console.log(`✅ Weeks API working - ${weeks.length} weeks found`);
    weeks.forEach(week => {
      console.log(`   📅 Week ${week.week_number}: ${week.title} (${week.week_files.length} files)`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Weeks API failed:', error.message);
    return false;
  }
}

async function testGroupsAPI() {
  console.log('🧪 Testing groups API...');
  
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Groups API error:', error);
      return false;
    }

    console.log(`✅ Groups API working - ${groups.length} groups found`);
    groups.forEach(group => {
      console.log(`   👥 ${group.name}: ${group.description}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Groups API failed:', error.message);
    return false;
  }
}

async function testAdminUser() {
  console.log('🧪 Testing admin user login...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nchaitanyanaidu@yahoo.com',
      password: 'adminncn@20'
    });

    if (error) {
      console.error('❌ Admin login error:', error);
      return false;
    }

    if (!data.user) {
      console.error('❌ No user data returned');
      return false;
    }

    console.log('✅ Admin login successful');
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return false;
    }

    console.log(`✅ Admin profile found - Role: ${profile.role}`);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Admin logout successful');
    
    return profile.role === 'admin';
  } catch (error) {
    console.error('❌ Admin test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Career Guidance Project fixes\n');
  
  const results = {
    weeks: await testWeeksAPI(),
    groups: await testGroupsAPI(),
    admin: await testAdminUser()
  };
  
  console.log('\n📊 Test Results:');
  console.log(`   Weeks API: ${results.weeks ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Groups API: ${results.groups ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Admin User: ${results.admin ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The fixes are working correctly.');
    console.log('\n📋 You can now:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000/weeks to see the weeks');
    console.log('3. Visit http://localhost:3000/groups to see the groups');
    console.log('4. Login as admin with: nchaitanyanaidu@yahoo.com / adminncn@20');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});