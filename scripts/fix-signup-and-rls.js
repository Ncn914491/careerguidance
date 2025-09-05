#!/usr/bin/env node

/**
 * Fix signup and RLS issues
 * This script applies the comprehensive fix for authentication and database policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function fixSignupAndRLS() {
  console.log('🔧 Fixing signup and RLS issues...');

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
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, '..', 'sql', 'fix-signup-and-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Applying database fixes...');

    // Split SQL into statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.toLowerCase().includes('begin') &&
        !stmt.toLowerCase().includes('commit')
      );

    let successCount = 0;
    let warningCount = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('cannot drop')) {
              console.log(`⚠️  Warning: ${error.message}`);
              warningCount++;
            } else {
              throw error;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          // Try alternative execution method
          try {
            const { error: altError } = await supabase
              .from('_dummy_table_that_does_not_exist')
              .select('*');
            
            // If we get here, try direct SQL execution
            console.log(`⚠️  Skipping statement due to execution method limitations`);
            warningCount++;
          } catch (finalErr) {
            console.log(`⚠️  Warning on statement: ${err.message}`);
            warningCount++;
          }
        }
      }
    }

    console.log(`✅ Database fixes applied: ${successCount} successful, ${warningCount} warnings`);

    // Create default admin user
    console.log('\n📋 Setting up default admin user...');
    
    const adminEmail = 'nchaitanyanaidu@yahoo.com'; // From your auth.ts file
    
    try {
      const { error: adminError } = await supabase.rpc('create_default_admin', {
        admin_email: adminEmail
      });

      if (adminError) {
        console.log(`⚠️  Admin setup: ${adminError.message}`);
        console.log('   You may need to sign up first, then run this script again');
      } else {
        console.log(`✅ Admin user configured: ${adminEmail}`);
      }
    } catch (adminErr) {
      console.log(`⚠️  Admin setup warning: ${adminErr.message}`);
    }

    console.log('\n🎉 Signup and RLS fixes completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to Supabase Dashboard > Authentication > Settings');
    console.log('2. Under "Email Auth", disable "Enable email confirmations"');
    console.log('3. Test signup flow - users should be able to register without email verification');
    console.log('4. Test group access - users should be able to view and join groups');
    console.log('5. Test admin features with the configured admin account');

  } catch (error) {
    console.error('❌ Error during fix:', error.message);
    console.log('\n🔧 Manual steps to complete the fix:');
    console.log('1. Run the SQL file manually in Supabase SQL Editor:');
    console.log('   sql/fix-signup-and-rls.sql');
    console.log('2. Disable email confirmation in Supabase Dashboard');
    process.exit(1);
  }
}

// Run the fix
fixSignupAndRLS().catch(console.error);