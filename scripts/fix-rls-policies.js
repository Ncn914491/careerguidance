const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies...\n')
    
    const sqlPath = path.join(__dirname, '..', 'sql', 'fix-rls-policies.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`${i + 1}. ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ Error: ${error.message}`)
          // Continue with other statements
        } else {
          console.log('✅ Success')
        }
      }
    }
    
    console.log('\n🎉 RLS policy fixes completed!')
    
    // Test the fix
    console.log('\n🧪 Testing the fix...')
    
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'nchaitanyanaidu@yahoo.com',
      password: 'adminncn@20'
    })

    if (authError) {
      console.error('❌ Authentication failed:', authError)
      return
    }

    // Test groups query
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')

    if (groupsError) {
      console.error('❌ Groups query still failing:', groupsError)
    } else {
      console.log(`✅ Groups query successful! Found ${groups.length} groups`)
    }

    // Test group memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', authData.user.id)

    if (membershipError) {
      console.error('❌ Memberships query failed:', membershipError)
    } else {
      console.log(`✅ Memberships query successful! Found ${memberships.length} memberships`)
    }

    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixRLSPolicies()