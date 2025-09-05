const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createDefaultGroup() {
  try {
    console.log('Creating default group...')
    
    // Check if "General Discussion" group already exists
    const { data: existingGroup, error: checkError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('name', 'General Discussion')
      .single()

    if (existingGroup) {
      console.log('Default group "General Discussion" already exists:', existingGroup.id)
      return
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing group:', checkError)
      return
    }

    // Create the default group
    const { data: newGroup, error: createError } = await supabase
      .from('groups')
      .insert({
        name: 'General Discussion',
        description: 'A place for general conversations and announcements',
        created_by: null // System created group
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating default group:', createError)
      return
    }

    console.log('Default group created successfully:', newGroup)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createDefaultGroup()