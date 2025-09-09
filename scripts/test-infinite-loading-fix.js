#!/usr/bin/env node

/**
 * Test script to verify infinite loading fixes
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
  console.log('🧪 Testing weeks API (should work without auth)...');
  
  try {
    const response = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/rest/v1/weeks?select=*,week_files(*)`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const weeks = await response.json();
    console.log(`✅ Weeks API working - ${weeks.length} weeks found`);
    return true;
  } catch (error) {
    console.error('❌ Weeks API failed:', error.message);
    return false;
  }
}

async function testGroupsAPI() {
  console.log('🧪 Testing groups API (should work without auth)...');
  
  try {
    const response = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/rest/v1/groups?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const groups = await response.json();
    console.log(`✅ Groups API working - ${groups.length} groups found`);
    return true;
  } catch (error) {
    console.error('❌ Groups API failed:', error.message);
    return false;
  }
}

async function testAIChatAPI() {
  console.log('🧪 Testing AI Chat API (should work without auth)...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Hello, this is a test message. Please respond briefly.' 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI Chat API working - Response received');
    console.log(`   📝 Response: ${data.response.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error('❌ AI Chat API failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   ℹ️  Make sure the development server is running (npm run dev)');
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Testing infinite loading fixes\n');
  
  const results = {
    weeks: await testWeeksAPI(),
    groups: await testGroupsAPI(),
    aiChat: await testAIChatAPI()
  };
  
  console.log('\n📊 Test Results:');
  console.log(`   Weeks API: ${results.weeks ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Groups API: ${results.groups ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   AI Chat API: ${results.aiChat ? '✅ PASS' : '❌ FAIL'}`);
  
  const publicAPIsWorking = results.weeks && results.groups;
  
  if (publicAPIsWorking) {
    console.log('\n🎉 Public APIs are working! The infinite loading should be fixed.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000/weeks (should load without infinite spinner)');
    console.log('3. Visit http://localhost:3000/groups (should load without infinite spinner)');
    console.log('4. Test the AI chat (should work without login)');
  } else {
    console.log('\n❌ Some APIs are still failing. Check the errors above.');
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});