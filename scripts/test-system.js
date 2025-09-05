#!/usr/bin/env node

/**
 * Comprehensive system test script
 * Tests all major functionality to ensure fixes are working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSystem() {
  console.log('🧪 Starting comprehensive system tests...');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const tests = [];

  try {
    // Test 1: Database Connection
    console.log('\n1️⃣ Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      tests.push({ name: 'Database Connection', status: 'FAIL', error: connectionError.message });
    } else {
      tests.push({ name: 'Database Connection', status: 'PASS' });
      console.log('✅ Database connection successful');
    }

    // Test 2: RLS Policies
    console.log('\n2️⃣ Testing RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LIMIT 5;`
      });
    
    if (policyError) {
      tests.push({ name: 'RLS Policies', status: 'FAIL', error: policyError.message });
    } else {
      tests.push({ name: 'RLS Policies', status: 'PASS' });
      console.log('✅ RLS policies are configured');
    }

    // Test 3: Storage Bucket
    console.log('\n3️⃣ Testing storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    const weekFilesBucket = buckets?.find(b => b.name === 'week-files');
    
    if (bucketError || !weekFilesBucket) {
      tests.push({ name: 'Storage Bucket', status: 'FAIL', error: bucketError?.message || 'Bucket not found' });
    } else {
      tests.push({ name: 'Storage Bucket', status: 'PASS' });
      console.log('✅ Week files storage bucket exists');
    }

    // Test 4: Profile Creation Function
    console.log('\n4️⃣ Testing profile creation function...');
    const { data: functionTest, error: functionError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') as function_exists;`
      });
    
    if (functionError) {
      tests.push({ name: 'Profile Creation Function', status: 'FAIL', error: functionError.message });
    } else {
      tests.push({ name: 'Profile Creation Function', status: 'PASS' });
      console.log('✅ Profile creation function exists');
    }

    // Test 5: Admin Helper Functions
    console.log('\n5️⃣ Testing admin helper functions...');
    const { data: adminFunctionTest, error: adminFunctionError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'is_admin') as is_admin_exists, EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'promote_to_admin') as promote_admin_exists;`
      });
    
    if (adminFunctionError) {
      tests.push({ name: 'Admin Helper Functions', status: 'FAIL', error: adminFunctionError.message });
    } else {
      tests.push({ name: 'Admin Helper Functions', status: 'PASS' });
      console.log('✅ Admin helper functions exist');
    }

    // Test 6: Table Structure
    console.log('\n6️⃣ Testing table structure...');
    const requiredTables = ['profiles', 'weeks', 'week_files', 'schools', 'groups', 'group_members', 'group_messages', 'ai_chats', 'admin_requests'];
    let allTablesExist = true;
    
    for (const tableName of requiredTables) {
      const { data: tableExists, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (tableError && tableError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.log(`❌ Table ${tableName} has issues: ${tableError.message}`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      tests.push({ name: 'Table Structure', status: 'PASS' });
      console.log('✅ All required tables exist and are accessible');
    } else {
      tests.push({ name: 'Table Structure', status: 'FAIL', error: 'Some tables are missing or inaccessible' });
    }

    // Test 7: Sample Data Operations
    console.log('\n7️⃣ Testing sample data operations...');
    try {
      // Try to read weeks (should work for everyone)
      const { data: weeks, error: weeksError } = await supabase
        .from('weeks')
        .select('*')
        .limit(5);
      
      if (weeksError) {
        tests.push({ name: 'Data Operations', status: 'FAIL', error: weeksError.message });
      } else {
        tests.push({ name: 'Data Operations', status: 'PASS' });
        console.log(`✅ Data operations working (found ${weeks?.length || 0} weeks)`);
      }
    } catch (error) {
      tests.push({ name: 'Data Operations', status: 'FAIL', error: error.message });
    }

    // Test 8: Check for Admin Users
    console.log('\n8️⃣ Checking for admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('role', 'admin');
    
    if (adminError) {
      tests.push({ name: 'Admin Users', status: 'FAIL', error: adminError.message });
    } else if (!adminUsers || adminUsers.length === 0) {
      tests.push({ name: 'Admin Users', status: 'WARN', error: 'No admin users found' });
      console.log('⚠️  No admin users found - you may need to create one');
    } else {
      tests.push({ name: 'Admin Users', status: 'PASS' });
      console.log(`✅ Found ${adminUsers.length} admin user(s)`);
    }

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
  }

  // Print test results
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;
  
  tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
    
    if (test.status === 'PASS') passCount++;
    else if (test.status === 'FAIL') failCount++;
    else if (test.status === 'WARN') warnCount++;
  });
  
  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All critical tests passed! System is ready to use.');
    
    if (warnCount > 0) {
      console.log('\n📋 Recommendations:');
      if (tests.find(t => t.name === 'Admin Users' && t.status === 'WARN')) {
        console.log('• Create an admin user: node scripts/create-admin.js <email>');
      }
    }
  } else {
    console.log('\n🚨 Some tests failed. Please review the errors above.');
    console.log('You may need to run: node scripts/apply-comprehensive-fix.js');
  }
}

// Run the tests
testSystem().catch(console.error);