const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUserProfiles() {
  try {
    console.log('Checking and fixing user profiles...')
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return
    }
    
    console.log(`Found ${authUsers.users.length} auth users`)
    
    // Check each user has a profile
    for (const authUser of authUsers.users) {
      console.log(`Checking user: ${authUser.email}`)
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log(`  Creating missing profile for ${authUser.email}`)
        
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || '',
            role: authUser.email === 'nchaitanyanaidu@yahoo.com' ? 'admin' : 'student'
          })
        
        if (insertError) {
          console.error(`  Error creating profile: ${insertError.message}`)
        } else {
          console.log(`  Profile created successfully`)
          
          // Add to default group if not admin
          if (authUser.email !== 'nchaitanyanaidu@yahoo.com') {
            const { data: defaultGroup } = await supabaseAdmin
              .from('groups')
              .select('id')
              .eq('name', 'General Discussion')
              .single()
            
            if (defaultGroup) {
              await supabaseAdmin
                .from('group_members')
                .insert({
                  group_id: defaultGroup.id,
                  user_id: authUser.id
                })
              console.log(`  Added to General Discussion group`)
            }
          }
        }
      } else if (profileError) {
        console.error(`  Error checking profile: ${profileError.message}`)
      } else {
        console.log(`  Profile exists: ${profile.role}`)
      }
    }
    
    console.log('Profile check complete!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixUserProfiles()