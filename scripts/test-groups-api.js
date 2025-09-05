const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testGroupsAPI() {
  try {
    console.log('Testing groups API...')
    
    // First, let's sign in as the admin user
    console.log('Signing in as admin...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'nchaitanyanaidu@yahoo.com',
      password: 'adminncn@20'
    })

    if (authError) {
      console.error('Authentication failed:', authError)
      return
    }

    console.log('✅ Authentication successful')
    console.log('User ID:', authData.user.id)

    // Test fetching groups directly from Supabase
    console.log('\nTesting direct Supabase query...')
    const { data: directGroups, error: directError } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(user_id)
      `)
      .eq('group_members.user_id', authData.user.id)

    if (directError) {
      console.error('Direct query error:', directError)
    } else {
      console.log('✅ Direct query successful')
      console.log('Groups found:', directGroups.length)
      directGroups.forEach(group => {
        console.log(`- ${group.name}: ${group.description}`)
      })
    }

    // Test the API endpoint
    console.log('\nTesting API endpoint...')
    const response = await fetch('http://localhost:3000/api/groups', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
    } else {
      const apiData = await response.json()
      console.log('✅ API request successful')
      console.log('API response:', apiData)
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testGroupsAPI()