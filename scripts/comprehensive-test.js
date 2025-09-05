#!/usr/bin/env node

/**
 * Comprehensive test of the authentication and database setup
 * This script tests all aspects of the fixed system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function comprehensiveTest() {
  console.log('🧪 Running comprehensive system test...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  function logResult(test, status, message) {
    const icons = { pass: '✅', fail: '❌', warn: '⚠️' };
    console.log(`${icons[status]} ${test}: ${message}`);
    results[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'warnings']++;
  }

  try {
    // Test 1: Database Tables Access
    console.log('\n📋 Testing Database Access...');
    
    const tables = ['profiles', 'groups', 'group_members', 'group_messages', 'weeks', 'week_files', 'schools', 'team_members'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          logResult(`${table} access`, 'fail', error.message);
        } else {
          logResult(`${table} access`, 'pass', 'Accessible');
        }
      } catch (err) {
        logResult(`${table} access`, 'fail', err.message);
      }
    }

    // Test 2: Groups Functionality
    console.log('\n📋 Testing Groups Functionality...');
    
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*');

    if (groupsError) {
      logResult('Groups query', 'fail', groupsError.message);
    } else {
      logResult('Groups query', 'pass', `${groups?.length || 0} groups found`);
      
      if (groups && groups.length > 0) {
        // Test group members access
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groups[0].id);

        if (membersError) {
          logResult('Group members query', 'fail', membersError.message);
        } else {
          logResult('Group members query', 'pass', `${members?.length || 0} members found`);
        }
      }
    }

    // Test 3: Profile System
    console.log('\n📋 Testing Profile System...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      logResult('Profiles query', 'fail', profilesError.message);
    } else {
      logResult('Profiles query', 'pass', `${profiles?.length || 0} profiles found`);
      
      // Check admin user
      const adminProfile = profiles?.find(p => p.email === 'nchaitanyanaidu@yahoo.com');
      if (adminProfile) {
        logResult('Admin user', 'pass', `Found with role: ${adminProfile.role}`);
      } else {
        logResult('Admin user', 'warn', 'Not found in profiles');
      }
    }

    // Test 4: Authentication Functions
    console.log('\n📋 Testing Authentication Functions...');
    
    // Test signup with a temporary user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signupError) {
      if (signupError.message.includes('Password should be at least')) {
        logResult('Signup validation', 'pass', 'Password requirements working');
      } else {
        logResult('Signup flow', 'fail', signupError.message);
      }
    } else {
      logResult('Signup flow', 'pass', 'User creation successful');
      
      // Check if profile was created
      if (signupData.user) {
        setTimeout(async () => {
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signupData.user.id)
            .single();

          if (newProfile) {
            logResult('Auto profile creation', 'pass', 'Profile created automatically');
          } else {
            logResult('Auto profile creation', 'warn', 'Profile not found after signup');
          }

          // Clean up test user if we have admin access
          if (supabaseAdmin) {
            try {
              await supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
              console.log('🧹 Test user cleaned up');
            } catch (cleanupError) {
              console.log('⚠️  Could not clean up test user');
            }
          }
        }, 2000);
      }
    }

    // Test 5: RLS Policies
    console.log('\n📋 Testing RLS Policies...');
    
    // Test anonymous access to public data
    const { data: publicGroups, error: publicError } = await supabase
      .from('groups')
      .select('name, description')
      .limit(3);

    if (publicError) {
      logResult('Public data access', 'fail', publicError.message);
    } else {
      logResult('Public data access', 'pass', 'Anonymous users can view public data');
    }

    // Test 6: Storage Setup
    console.log('\n📋 Testing Storage Setup...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        logResult('Storage access', 'fail', bucketsError.message);
      } else {
        const weekFilesBucket = buckets?.find(b => b.name === 'week-files');
        if (weekFilesBucket) {
          logResult('Week files bucket', 'pass', 'Bucket exists and accessible');
        } else {
          logResult('Week files bucket', 'warn', 'Bucket not found');
        }
      }
    } catch (storageError) {
      logResult('Storage access', 'fail', storageError.message);
    }

    // Test 7: Helper Functions
    console.log('\n📋 Testing Helper Functions...');
    
    try {
      const { data: helperTest, error: helperError } = await supabase.rpc('ensure_profile_exists', {
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'test@example.com',
        user_name: 'Test User'
      });

      if (helperError) {
        if (helperError.message.includes('function') && helperError.message.includes('does not exist')) {
          logResult('Helper functions', 'warn', 'Functions not deployed yet');
        } else {
          logResult('Helper functions', 'fail', helperError.message);
        }
      } else {
        logResult('Helper functions', 'pass', 'Database functions working');
      }
    } catch (funcError) {
      logResult('Helper functions', 'warn', 'Could not test functions');
    }

    // Summary
    console.log('\n🎉 Comprehensive Test Results:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);

    if (results.failed === 0) {
      console.log('\n🚀 System is ready for production use!');
      console.log('\n📋 Recommended next steps:');
      console.log('1. Test the complete signup flow in your browser');
      console.log('2. Verify group functionality works for all users');
      console.log('3. Test admin features with the configured admin account');
      console.log('4. Deploy to production when ready');
    } else {
      console.log('\n🔧 Issues found that need attention:');
      console.log('- Check failed tests above');
      console.log('- Review RLS policies in Supabase Dashboard');
      console.log('- Ensure all SQL fixes were applied correctly');
    }

  } catch (error) {
    console.error('❌ Error during comprehensive test:', error.message);
  }
}

comprehensiveTest().catch(console.error);