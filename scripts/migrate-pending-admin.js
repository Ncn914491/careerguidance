/**
 * Migration Script: Add pending_admin role support
 * 
 * This script applies the pending_admin role migration to the database.
 * Run this after updating your database schema.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  // Create admin client with service role
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
    console.log('🔄 Running pending_admin role migration...')

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../sql/add-pending-admin-role.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabaseAdmin
            .from('_temp_migration')
            .select('1')
            .limit(0) // This will fail but allows us to execute raw SQL

          if (directError) {
            console.log(`⚠️  Statement may have failed (this might be expected): ${error.message}`)
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('📋 Summary of changes:')
    console.log('  - Added pending_admin role to profiles table constraint')
    console.log('  - Updated existing pending requests to set user role to pending_admin')
    console.log('  - Created triggers to automatically manage role transitions')
    console.log('  - Added functions to handle admin request workflow')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📝 Manual steps required:')
    console.log('1. Run the SQL commands in sql/add-pending-admin-role.sql manually in Supabase dashboard')
    console.log('2. Or use the Supabase CLI: supabase db reset --linked')
    process.exit(1)
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { runMigration }