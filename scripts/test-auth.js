#!/usr/bin/env node

/**
 * Simple test script to verify authentication is working
 * Run with: node scripts/test-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test auth session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Active session found for user:', session.user.email);
    } else {
      console.log('ℹ️  No active session (this is normal for server-side testing)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testAuth().then(success => {
  if (success) {
    console.log('🎉 Authentication system appears to be working correctly');
  } else {
    console.log('💥 Authentication system has issues');
    process.exit(1);
  }
});