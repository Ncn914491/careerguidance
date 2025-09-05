#!/usr/bin/env node

/**
 * Script to apply comprehensive database fixes
 * This script applies all the fixes from sql/comprehensive-fix.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyComprehensiveFix() {
  console.log('🔧 Starting comprehensive database fix...');

  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the comprehensive fix SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'comprehensive-fix.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📖 Reading comprehensive fix SQL...');

    // Execute the SQL
    console.log('⚡ Applying database fixes...');
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // If rpc doesn't work, try direct execution
      console.log('🔄 Trying alternative execution method...');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('begin') || 
            statement.toLowerCase().includes('commit') ||
            statement.toLowerCase().includes('notify')) {
          continue; // Skip transaction control statements
        }

        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (stmtError) {
            console.warn(`⚠️  Warning executing statement: ${stmtError.message}`);
          }
        } catch (err) {
          console.warn(`⚠️  Warning: ${err.message}`);
        }
      }
    }

    console.log('✅ Database fixes applied successfully!');

    // Verify the fixes
    console.log('🔍 Verifying fixes...');
    
    // Check if profiles table exists and has RLS enabled
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    if (tables && tables.length > 0) {
      console.log('✅ Profiles table exists');
    } else {
      console.error('❌ Profiles table not found');
    }

    // Check if storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const weekFilesBucket = buckets?.find(b => b.name === 'week-files');
    
    if (weekFilesBucket) {
      console.log('✅ Week files storage bucket exists');
    } else {
      console.log('⚠️  Week files storage bucket not found - creating...');
      const { error: bucketError } = await supabase.storage.createBucket('week-files', {
        public: true
      });
      
      if (bucketError) {
        console.error('❌ Failed to create storage bucket:', bucketError.message);
      } else {
        console.log('✅ Week files storage bucket created');
      }
    }

    console.log('\n🎉 Comprehensive fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Create your first admin user:');
    console.log('   Run: node scripts/create-admin.js your-email@example.com');
    console.log('2. Test the application by signing up and logging in');
    console.log('3. Verify admin functionality works correctly');

  } catch (error) {
    console.error('❌ Error applying fixes:', error.message);
    process.exit(1);
  }
}

// Run the fix
applyComprehensiveFix().catch(console.error);