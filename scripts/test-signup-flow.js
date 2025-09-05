const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testSignupFlow() {
  try {
    console.log('Testing signup flow...')
    
    // Test email (use a unique one for testing)
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    const testName = 'Test User'
    
    console.log('Attempting signup with:', testEmail)
    
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    })
    
    if (error) {
      console.error('Signup error:', error)
      return
    }
    
    console.log('Signup successful:', data.user?.id)
    
    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('Profile check error:', profileError)
    } else {
      console.log('Profile created successfully:', profile)
    }
    
    // Check if user was added to default group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*, groups(name)')
      .eq('user_id', data.user.id)
    
    if (membershipError) {
      console.error('Membership check error:', membershipError)
    } else {
      console.log('Group memberships:', membership)
    }
    
    // Clean up - delete the test user
    console.log('Cleaning up test user...')
    // Note: In production, you'd need admin privileges to delete users
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testSignupFlow()