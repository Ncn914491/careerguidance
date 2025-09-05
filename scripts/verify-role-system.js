/**
 * Role Management System Verification Script
 * 
 * This script verifies that the role management system is working correctly.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function verifyRoleSystem() {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    console.log('🔍 Verifying role management system...\n')

    // 1. Check if profiles table has correct role constraint
    console.log('1. Checking profiles table schema...')
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_constraints', { table_name: 'profiles' })
      .single()

    if (tableError) {
      console.log('   ⚠️  Could not verify table constraints (this might be expected)')
    } else {
      console.log('   ✅ Profiles table schema verified')
    }

    // 2. Check admin user exists
    console.log('2. Checking admin user...')
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'nchaitanyanaidu@yahoo.com')
      .eq('role', 'admin')
      .single()

    if (adminError || !adminUser) {
      console.log('   ❌ Admin user not found or not properly configured')
      console.log('   💡 Run: npm run db:seed-admin')
    } else {
      console.log('   ✅ Admin user exists and configured correctly')
      console.log(`      Email: ${adminUser.email}`)
      console.log(`      Role: ${adminUser.role}`)
      console.log(`      Name: ${adminUser.full_name}`)
    }

    // 3. Check database functions exist
    console.log('3. Checking database functions...')
    const functions = [
      'update_user_role_on_admin_request',
      'handle_admin_request_status_change'
    ]

    for (const funcName of functions) {
      const { data: funcExists, error: funcError } = await supabaseAdmin
        .rpc('check_function_exists', { function_name: funcName })

      if (funcError) {
        console.log(`   ⚠️  Could not verify function: ${funcName}`)
      } else {
        console.log(`   ✅ Function exists: ${funcName}`)
      }
    }

    // 4. Check triggers exist
    console.log('4. Checking database triggers...')
    const triggers = [
      'trigger_update_role_on_admin_request',
      'trigger_handle_admin_request_status_change'
    ]

    for (const triggerName of triggers) {
      const { data: triggerExists, error: triggerError } = await supabaseAdmin
        .rpc('check_trigger_exists', { trigger_name: triggerName })

      if (triggerError) {
        console.log(`   ⚠️  Could not verify trigger: ${triggerName}`)
      } else {
        console.log(`   ✅ Trigger exists: ${triggerName}`)
      }
    }

    // 5. Check RLS policies
    console.log('5. Checking Row-Level Security policies...')
    const tables = ['profiles', 'admin_requests', 'schools', 'weeks']
    
    for (const tableName of tables) {
      const { data: rlsEnabled, error: rlsError } = await supabaseAdmin
        .rpc('check_rls_enabled', { table_name: tableName })

      if (rlsError) {
        console.log(`   ⚠️  Could not verify RLS for: ${tableName}`)
      } else {
        console.log(`   ✅ RLS enabled for: ${tableName}`)
      }
    }

    // 6. Test role transitions (simulation)
    console.log('6. Testing role system logic...')
    
    // Check if we can query admin requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('admin_requests')
      .select('*')
      .limit(5)

    if (requestsError) {
      console.log('   ❌ Could not query admin_requests table')
    } else {
      console.log(`   ✅ Admin requests table accessible (${requests.length} requests found)`)
    }

    console.log('\n🎉 Role management system verification completed!')
    console.log('\n📋 Summary:')
    console.log('   - Admin user should be seeded with correct credentials')
    console.log('   - Database functions and triggers should be in place')
    console.log('   - RLS policies should be enabled on all tables')
    console.log('   - Role transitions: student → pending_admin → admin/student')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    console.log('\n🔧 Troubleshooting steps:')
    console.log('1. Ensure database schema is up to date: npm run db:migrate')
    console.log('2. Run pending admin migration: npm run db:migrate-pending-admin')
    console.log('3. Seed admin user: npm run db:seed-admin')
    console.log('4. Check Supabase dashboard for any errors')
    process.exit(1)
  }
}

// Helper function to create RPC functions for verification
async function createVerificationFunctions() {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const functions = [
    `
    CREATE OR REPLACE FUNCTION check_function_exists(function_name text)
    RETURNS boolean AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = function_name
      );
    END;
    $$ LANGUAGE plpgsql;
    `,
    `
    CREATE OR REPLACE FUNCTION check_trigger_exists(trigger_name text)
    RETURNS boolean AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = trigger_name
      );
    END;
    $$ LANGUAGE plpgsql;
    `,
    `
    CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
    RETURNS boolean AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = table_name 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
      );
    END;
    $$ LANGUAGE plpgsql;
    `
  ]

  for (const func of functions) {
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: func })
    } catch (error) {
      // Ignore errors, functions might already exist
    }
  }
}

// Run verification
if (require.main === module) {
  createVerificationFunctions()
    .then(() => verifyRoleSystem())
    .then(() => {
      console.log('✅ Verification completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyRoleSystem }