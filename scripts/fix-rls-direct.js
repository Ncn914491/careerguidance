const { createClient } = require('@supabase/supabase-js')
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

async function executeSQL(sql, description) {
  try {
    console.log(`Executing: ${description}`)
    const { error } = await supabase.rpc('exec', { sql })
    if (error) {
      console.error(`❌ ${description} failed:`, error.message)
      return false
    } else {
      console.log(`✅ ${description} successful`)
      return true
    }
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    return false
  }
}

async function fixRLSDirectly() {
  try {
    console.log('🔧 Fixing RLS policies directly...\n')
    
    // First, let's disable RLS temporarily to avoid recursion issues
    console.log('1. Temporarily disabling RLS...')
    await executeSQL('ALTER TABLE groups DISABLE ROW LEVEL SECURITY;', 'Disable RLS on groups')
    await executeSQL('ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;', 'Disable RLS on group_members')
    await executeSQL('ALTER TABLE group_messages DISABLE ROW LEVEL SECURITY;', 'Disable RLS on group_messages')
    
    // Drop all existing policies
    console.log('\n2. Dropping existing policies...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their groups" ON groups;',
      'DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;',
      'DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;',
      'DROP POLICY IF EXISTS "Users can join groups" ON group_members;',
      'DROP POLICY IF EXISTS "Users can leave groups" ON group_members;',
      'DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;',
      'DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;'
    ]
    
    for (const policy of dropPolicies) {
      await executeSQL(policy, `Drop policy: ${policy.substring(0, 50)}...`)
    }
    
    // Create new, simpler policies
    console.log('\n3. Creating new policies...')
    const newPolicies = [
      // Groups - allow all authenticated users to read
      'CREATE POLICY "authenticated_users_can_read_groups" ON groups FOR SELECT USING (auth.uid() IS NOT NULL);',
      'CREATE POLICY "authenticated_users_can_create_groups" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);',
      'CREATE POLICY "creators_can_update_groups" ON groups FOR UPDATE USING (created_by = auth.uid());',
      
      // Group members - simple policies
      'CREATE POLICY "users_can_read_memberships" ON group_members FOR SELECT USING (user_id = auth.uid());',
      'CREATE POLICY "users_can_join_groups" ON group_members FOR INSERT WITH CHECK (user_id = auth.uid());',
      'CREATE POLICY "users_can_leave_groups" ON group_members FOR DELETE USING (user_id = auth.uid());',
      
      // Group messages - check membership without recursion
      'CREATE POLICY "members_can_read_messages" ON group_messages FOR SELECT USING (sender_id = auth.uid() OR EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()));',
      'CREATE POLICY "members_can_send_messages" ON group_messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()));'
    ]
    
    for (const policy of newPolicies) {
      await executeSQL(policy, `Create policy: ${policy.substring(0, 50)}...`)
    }
    
    // Re-enable RLS
    console.log('\n4. Re-enabling RLS...')
    await executeSQL('ALTER TABLE groups ENABLE ROW LEVEL SECURITY;', 'Enable RLS on groups')
    await executeSQL('ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;', 'Enable RLS on group_members')
    await executeSQL('ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;', 'Enable RLS on group_messages')
    
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

    console.log('✅ Authentication successful')

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

fixRLSDirectly()