const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugUserGroups() {
  try {
    console.log('Debugging user groups and memberships...')
    
    // Get all users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role')
      .limit(10)
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }
    
    console.log('Found profiles:', profiles.length)
    
    // Get all groups
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name, description')
    
    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return
    }
    
    console.log('Available groups:')
    groups.forEach(group => {
      console.log(`  - ${group.name} (${group.id})`)
    })
    
    // Check memberships for each user
    for (const profile of profiles) {
      console.log(`\nUser: ${profile.email} (${profile.id})`)
      
      const { data: memberships, error: membershipError } = await supabaseAdmin
        .from('group_members')
        .select('*, groups(name)')
        .eq('user_id', profile.id)
      
      if (membershipError) {
        console.error(`  Error fetching memberships: ${membershipError.message}`)
      } else if (memberships.length === 0) {
        console.log('  No group memberships')
      } else {
        console.log('  Member of:')
        memberships.forEach(membership => {
          console.log(`    - ${membership.groups.name}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

debugUserGroups()