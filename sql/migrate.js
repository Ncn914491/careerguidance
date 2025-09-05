#!/usr/bin/env node

/**
 * Database Migration Script for Career Guidance Project
 * 
 * This script automatically applies the database schema to your Supabase project.
 * It reads the init.sql file and executes it using the Supabase client.
 * 
 * Usage:
 *   node sql/migrate.js
 * 
 * Requirements:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 *   - @supabase/supabase-js package installed
 */

const fs = require('fs');
const path = require('path');
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
  console.error('');
  console.error('   Example .env.local:');
  console.error('   SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute SQL statements from a file
 */
async function executeSqlFile(filePath) {
  try {
    console.log(`📖 Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('🚀 Executing SQL statements...');
    // Supabase doesn't have exec_sql by default, use direct execution
    return await executeDirectSql(sqlContent);
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    return { success: false, error };
  }
}

/**
 * Execute SQL directly using Supabase REST API
 */
async function executeDirectSql(sqlContent) {
  try {
    console.log('📝 Executing SQL via Supabase REST API...');
    
    // Use fetch to call Supabase REST API directly for SQL execution
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: sqlContent })
    });
    
    if (!response.ok) {
      // If exec RPC doesn't exist, try manual execution via psql-style approach
      console.log('⚠️  Direct SQL execution not available, using alternative method...');
      return await executeStatementsManually(sqlContent);
    }
    
    const result = await response.json();
    console.log('✅ SQL executed successfully via REST API');
    return { success: true, data: result };
  } catch (error) {
    console.log('⚠️  REST API execution failed, trying manual approach...');
    return await executeStatementsManually(sqlContent);
  }
}

/**
 * Execute statements manually by creating tables one by one
 */
async function executeStatementsManually(sqlContent) {
  try {
    // For this demo, we'll provide instructions for manual execution
    console.log('📋 Manual execution required. Please follow these steps:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of sql/init.sql');
    console.log('4. Click "Run" to execute all statements');
    console.log('');
    console.log('Alternatively, you can use the Supabase CLI:');
    console.log('   supabase db push');
    console.log('');
    
    // For now, we'll return success and let the user know to execute manually
    console.log('⚠️  Automated migration requires manual setup.');
    console.log('   Please execute sql/init.sql in Supabase Dashboard.');
    
    return { 
      success: true, 
      manual: true,
      message: 'Please execute sql/init.sql manually in Supabase Dashboard'
    };
  } catch (error) {
    console.error('❌ Error in manual execution setup:', error.message);
    return { success: false, error };
  }
}

/**
 * Verify the migration by checking if tables exist
 */
async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration...');
    
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.error('❌ Error verifying migration:', error.message);
      return false;
    }
    
    const expectedTables = [
      'profiles',
      'schools', 
      'team_members',
      'weeks',
      'week_files',
      'groups',
      'group_members',
      'group_messages',
      'ai_chats',
      'admin_requests'
    ];
    
    const actualTables = data.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !actualTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables.join(', '));
      return false;
    }
    
    console.log('✅ All expected tables found');
    console.log(`📊 Created tables: ${actualTables.join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🎯 Starting database migration for Career Guidance Project');
  console.log('');
  
  const sqlFilePath = path.join(__dirname, 'init.sql');
  
  // Check if SQL file exists
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Error: SQL file not found at ${sqlFilePath}`);
    process.exit(1);
  }
  
  // Execute migration
  const result = await executeSqlFile(sqlFilePath);
  
  if (!result.success) {
    console.error('❌ Migration failed');
    process.exit(1);
  }
  
  if (result.manual) {
    console.log('');
    console.log('📋 Manual migration setup completed!');
    console.log('');
    console.log('To complete the setup:');
    console.log('1. Execute sql/init.sql in Supabase Dashboard SQL Editor');
    console.log('2. Run this script again to verify the migration');
    console.log('3. Seed initial data using sql/seed.sql');
    return;
  }
  
  // Verify migration
  const verified = await verifyMigration();
  
  if (!verified) {
    console.error('❌ Migration verification failed');
    console.log('');
    console.log('If you executed the SQL manually, the tables might exist.');
    console.log('You can check your Supabase Dashboard to verify.');
    process.exit(1);
  }
  
  console.log('');
  console.log('🎉 Database migration completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Seed initial data (team members, schools)');
  console.log('2. Test database connections in your application');
  console.log('3. Configure authentication and user management');
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration, executeSqlFile, verifyMigration };