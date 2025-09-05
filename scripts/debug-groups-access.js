const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugGroupsAccess() {
  try {
    console.log('🔍 Debugging groups access...\n')
    
    // 1. Check if groups exist (using admin client)
    console.log('1. Checking if groups exist (admin access)...')
    const { data: allGroups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('*')

    if (groupsError) {
      console.error('❌ Error fetching groups with admin:', groupsError)
      return
    }

    console.log(`✅ Found ${allGroups.length} groups:`)
    allGroups.forEach(group => {
      console.log(`   - ${group.name} (ID: ${group.id})`)
    })

    // 2. Check if admin user exists
    console.log('\n2. Checking admin user...')
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'nchaitanyanaidu@yahoo.com')
      .single()

    if (adminError) {
      console.error('❌ Admin user not found:', adminError)
      return
    }

    console.log('✅ Admin user found:')
    console.log(`   - ID: ${adminProfile.id}`)
    console.log(`   - Email: ${adminProfile.email}`)
    console.log(`   - Role: ${adminProfile.role}`)

    // 3. Check group memberships
    console.log('\n3. Checking group memberships...')
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select(`
        *,
        groups(name)
      `)
      .eq('user_id', adminProfile.id)

    if (membershipError) {
      console.error('❌ Error fetching memberships:', membershipError)
    } else {
      console.log(`✅ Admin is member of ${memberships.length} groups:`)
      memberships.forEach(membership => {
        console.log(`   - ${membership.groups.name}`)
      })
    }

    // 4. Test authentication
    console.log('\n4. Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'nchaitanyanaidu@yahoo.com',
      password: 'adminncn@20'
    })

    if (authError) {
      console.error('❌ Authentication failed:', authError)
      return
    }

    console.log('✅ Authentication successful')
    console.log(`   - User ID: ${authData.user.id}`)

    // 5. Test RLS policies with authenticated user
    console.log('\n5. Testing RLS policies with authenticated user...')
    
    // Test groups query with RLS
    const { data: userGroups, error: userGroupsError } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(user_id)
      `)
      .eq('group_members.user_id', authData.user.id)

    if (userGroupsError) {
      console.error('❌ RLS query failed:', userGroupsError)
      
      // Let's try a simpler query
      console.log('\n   Trying simpler query...')
      const { data: simpleGroups, error: simpleError } = await supabase
        .from('groups')
        .select('*')

      if (simpleError) {
        console.error('❌ Simple groups query failed:', simpleError)
      } else {
        console.log(`✅ Simple query worked, found ${simpleGroups.length} groups`)
      }

    } else {
      console.log(`✅ RLS query successful, found ${userGroups.length} groups:`)
      userGroups.forEach(group => {
        console.log(`   - ${group.name}`)
      })
    }

    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('get_policies', { schema_name: 'public', table_name: 'groups' })
      .catch(() => {
        // If the function doesn't exist, we'll check manually
        return { data: null, error: 'RPC function not available' }
      })

    if (policiesError) {
      console.log('⚠️  Could not fetch RLS policies automatically')
      console.log('   Please check in Supabase Dashboard: Authentication > Policies')
    } else if (policies) {
      console.log('✅ RLS policies found:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`)
      })
    }

    // 7. Test direct group_members query
    console.log('\n7. Testing group_members access...')
    const { data: directMembers, error: directMembersError } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', authData.user.id)

    if (directMembersError) {
      console.error('❌ group_members query failed:', directMembersError)
    } else {
      console.log(`✅ Found ${directMembers.length} memberships`)
    }

    await supabase.auth.signOut()

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugGroupsAccess()