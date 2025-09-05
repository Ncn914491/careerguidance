const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testMessagesAPI() {
  try {
    console.log('Testing messages API...')
    
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'nchaitanyanaidu@yahoo.com',
      password: 'adminncn@20'
    })
    
    if (authError) {
      console.error('Auth error:', authError)
      return
    }
    
    console.log('Signed in as:', authData.user.email)
    
    // Get General Discussion group ID
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('name', 'General Discussion')
      .single()
    
    if (groupError) {
      console.error('Group error:', groupError)
      return
    }
    
    console.log('Testing with group:', group.name, group.id)
    
    // Test fetching messages via API
    const response = await fetch(`http://localhost:3000/api/groups/${group.id}/messages`, {
      headers: {
        'Cookie': `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}`
      }
    })
    
    console.log('API Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Messages fetched successfully:', data.messages?.length || 0, 'messages')
    } else {
      const errorData = await response.json()
      console.error('API Error:', errorData)
    }
    
    // Sign out
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testMessagesAPI()