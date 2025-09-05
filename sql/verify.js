#!/usr/bin/env node

/**
 * Database Migration Verification Script
 * 
 * This script verifies that the database schema has been properly applied.
 * Run this after manually executing sql/init.sql in Supabase Dashboard.
 * 
 * Usage:
 *   node sql/verify.js
 */

require('dotenv').config({ path: '.env.local' });

// Import Supabase client
let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (error) {
  console.error('❌ Error: @supabase/supabase-js not found. Please install it:');
  console.error('   npm install @supabase/supabase-js');
  process.exit(1);
}

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Verify the migration by checking tables and policies
 */
async function verifyMigration() {
  console.log('🔍 Verifying database migration...');
  console.log('');
  
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');
    
    if (tablesError) {
      // Fallback: try to query a specific table
      console.log('📋 Checking tables individually...');
      const expectedTables = [
        'profiles', 'schools', 'team_members', 'weeks', 'week_files',
        'groups', 'group_members', 'group_messages', 'ai_chats', 'admin_requests'
      ];
      
      const existingTables = [];
      const missingTables = [];
      
      for (const tableName of expectedTables) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error && error.code === '42P01') {
            missingTables.push(tableName);
          } else {
            existingTables.push(tableName);
          }
        } catch (e) {
          missingTables.push(tableName);
        }
      }
      
      console.log(`✅ Found tables: ${existingTables.join(', ')}`);
      
      if (missingTables.length > 0) {
        console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
        console.log('');
        console.log('Please execute sql/init.sql in Supabase Dashboard to create missing tables.');
        return false;
      }
      
      console.log('✅ All expected tables found!');
    } else {
      console.log('✅ Schema verification successful');
    }
    
    // Test basic operations
    console.log('');
    console.log('🧪 Testing basic database operations...');
    
    // Test reading from profiles (should work even if empty)
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log(`❌ Error accessing profiles table: ${profilesError.message}`);
      return false;
    }
    
    console.log('✅ Profiles table accessible');
    
    // Test reading from schools
    const { error: schoolsError } = await supabase
      .from('schools')
      .select('id')
      .limit(1);
    
    if (schoolsError) {
      console.log(`❌ Error accessing schools table: ${schoolsError.message}`);
      return false;
    }
    
    console.log('✅ Schools table accessible');
    
    // Test reading from team_members
    const { error: teamError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);
    
    if (teamError) {
      console.log(`❌ Error accessing team_members table: ${teamError.message}`);
      return false;
    }
    
    console.log('✅ Team members table accessible');
    
    console.log('');
    console.log('🎉 Database verification completed successfully!');
    console.log('');
    console.log('Your database is ready for use. Next steps:');
    console.log('1. Seed initial data: Execute sql/seed.sql in Supabase Dashboard');
    console.log('2. Test your application connections');
    console.log('3. Set up authentication and user management');
    
    return true;
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyMigration().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyMigration };