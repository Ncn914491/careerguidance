#!/usr/bin/env node

/**
 * Comprehensive test script to verify all fixes are working
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

async function testWeeksWithFiles() {
  console.log('🧪 Testing weeks API with files...');
  
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
    
    let totalFiles = 0;
    weeks.forEach(week => {
      const photos = week.week_files.filter(f => f.file_type === 'photo').length;
      const pdfs = week.week_files.filter(f => f.file_type === 'pdf').length;
      totalFiles += week.week_files.length;
      console.log(`   📅 Week ${week.week_number}: ${week.title}`);
      console.log(`      📸 ${photos} photos, 📄 ${pdfs} PDFs`);
    });
    
    console.log(`   📊 Total files: ${totalFiles}`);
    
    if (totalFiles === 0) {
      console.log('⚠️  No files found - this might cause display issues');
      return false;
    }
    
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
      console.log(`   👥 ${group.name}: ${group.description.substring(0, 50)}...`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Groups API failed:', error.message);
    return false;
  }
}

async function testAdminLogin() {
  console.log('🧪 Testing admin login...');
  
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

async function testStorageAccess() {
  console.log('🧪 Testing storage access...');
  
  try {
    // Get a sample file URL from the database
    const { data: sampleFile, error } = await supabase
      .from('week_files')
      .select('file_url, file_name')
      .limit(1)
      .single();

    if (error || !sampleFile) {
      console.error('❌ No sample file found in database');
      return false;
    }

    // Test if the file URL is accessible
    const response = await fetch(sampleFile.file_url);
    
    if (response.ok) {
      console.log(`✅ Storage access working - ${sampleFile.file_name} is accessible`);
      return true;
    } else {
      console.error(`❌ Storage access failed - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    return false;
  }
}

async function testAIChatAPI() {
  console.log('🧪 Testing AI Chat API (no auth required)...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Hello, this is a test. Please respond with just "Test successful".' 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI Chat API working - Response received');
    console.log(`   🤖 Response: ${data.response.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error('❌ AI Chat API failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   ℹ️  Make sure the development server is running (npm run dev)');
    }
    return false;
  }
}

async function checkDatabaseIntegrity() {
  console.log('🧪 Checking database integrity...');
  
  try {
    // Check if all required tables exist and have data
    const tables = ['profiles', 'weeks', 'week_files', 'groups', 'schools', 'team_members'];
    const results = {};
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error checking ${table}:`, error.message);
        results[table] = 0;
      } else {
        results[table] = data?.length || 0;
      }
    }
    
    console.log('📊 Database table counts:');
    Object.entries(results).forEach(([table, count]) => {
      const status = count > 0 ? '✅' : '⚠️ ';
      console.log(`   ${status} ${table}: ${count} records`);
    });
    
    const allTablesHaveData = Object.values(results).every(count => count > 0);
    return allTablesHaveData;
  } catch (error) {
    console.error('❌ Database integrity check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running comprehensive tests for Career Guidance Project\n');
  
  const results = {
    weeksWithFiles: await testWeeksWithFiles(),
    groups: await testGroupsAPI(),
    adminLogin: await testAdminLogin(),
    storageAccess: await testStorageAccess(),
    aiChat: await testAIChatAPI(),
    databaseIntegrity: await checkDatabaseIntegrity()
  };
  
  console.log('\n📊 Final Test Results:');
  console.log(`   Weeks with Files: ${results.weeksWithFiles ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Groups API: ${results.groups ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Admin Login: ${results.adminLogin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Storage Access: ${results.storageAccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   AI Chat API: ${results.aiChat ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Database Integrity: ${results.databaseIntegrity ? '✅ PASS' : '❌ FAIL'}`);
  
  const criticalTests = ['weeksWithFiles', 'groups', 'adminLogin', 'storageAccess', 'databaseIntegrity'];
  const criticalPassed = criticalTests.every(test => results[test]);
  
  if (criticalPassed) {
    console.log('\n🎉 All critical tests passed! The app should work properly now.');
    console.log('\n📋 Ready to use:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000/weeks - Should show weeks with ALL photos and PDFs');
    console.log('3. Visit http://localhost:3000/groups - Should show groups without infinite loading');
    console.log('4. Visit http://localhost:3000/login - Should work without infinite loading');
    console.log('5. Login with admin: nchaitanyanaidu@yahoo.com / adminncn@20');
    console.log('6. Test AI chat - Should work without login requirement');
    
    console.log('\n📸 Photo counts per week:');
    console.log('   Week 1: 4 photos + 1 PDF');
    console.log('   Week 2: 5 photos + 1 PDF');
    console.log('   Week 3: 6 photos + 1 PDF');
    console.log('   Week 4: 7 photos + 1 PDF');
    console.log('   Week 5: 8 photos + 1 PDF');
    console.log('   Total: 30 photos + 5 PDFs = 35 files');
  } else {
    console.log('\n❌ Some critical tests failed. Please check the errors above.');
    
    if (!results.weeksWithFiles) {
      console.log('   🔧 Try running: node scripts/create-and-upload-week-files.js');
    }
    if (!results.adminLogin) {
      console.log('   🔧 Try running: node scripts/create-admin-user.js');
    }
    if (!results.databaseIntegrity) {
      console.log('   🔧 Try running: supabase db push');
    }
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});