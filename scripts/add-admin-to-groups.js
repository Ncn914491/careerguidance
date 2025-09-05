const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addAdminToGroups() {
  try {
    console.log('Adding admin user to all groups...')
    
    // Get admin user
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', 'nchaitanyanaidu@yahoo.com')
      .single()
    
    if (adminError || !adminProfile) {
      console.error('Admin user not found:', adminError)
      return
    }
    
    console.log('Found admin user:', adminProfile.email)
    
    // Get all groups
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
    
    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return
    }
    
    console.log('Adding admin to groups...')
    
    // Add admin to all groups
    for (const group of groups) {
      const { error: membershipError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: adminProfile.id
        })
        .select()
      
      if (membershipError) {
        if (membershipError.code === '23505') {
          console.log(`  Already member of: ${group.name}`)
        } else {
          console.error(`  Error adding to ${group.name}:`, membershipError.message)
        }
      } else {
        console.log(`  Added to: ${group.name}`)
      }
    }
    
    console.log('Done!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addAdminToGroups()