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

async function seedGroups() {
  try {
    console.log('Seeding groups...')
    
    const groups = [
      {
        name: 'General Discussion',
        description: 'Main group for all participants to discuss career guidance topics'
      },
      {
        name: 'Technical Q&A',
        description: 'Group focused on technical questions and programming help'
      },
      {
        name: 'Project Collaboration',
        description: 'Space for students to collaborate on projects and assignments'
      },
      {
        name: 'Industry Insights',
        description: 'Discussions about industry trends and career opportunities'
      }
    ]
    
    for (const group of groups) {
      // Check if group already exists
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('name', group.name)
        .single()
      
      if (existing) {
        console.log(`Group "${group.name}" already exists`)
        continue
      }
      
      const { data, error } = await supabase
        .from('groups')
        .insert(group)
        .select()
        .single()
      
      if (error) {
        console.error(`Error creating group "${group.name}":`, error)
      } else {
        console.log(`✅ Created group: ${group.name}`)
      }
    }
    
    // Now add admin to all groups
    console.log('\nAdding admin to groups...')
    
    // Find the admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'nchaitanyanaidu@yahoo.com')
      .single()

    if (adminError || !adminProfile) {
      console.error('Admin user not found:', adminError)
      return
    }

    console.log('Admin user found:', adminProfile.email)

    // Get all groups
    const { data: allGroups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')

    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return
    }

    console.log(`Found ${allGroups.length} groups`)

    // Add admin to each group
    for (const group of allGroups) {
      // Check if admin is already a member
      const { data: existingMembership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', adminProfile.id)
        .single()

      if (existingMembership) {
        console.log(`Admin already member of: ${group.name}`)
        continue
      }

      // Add admin to group
      const { error: membershipError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: adminProfile.id
        })

      if (membershipError) {
        console.error(`Error adding admin to ${group.name}:`, membershipError)
      } else {
        console.log(`✅ Added admin to: ${group.name}`)
      }
    }

    // Add welcome messages
    console.log('\nAdding welcome messages...')
    
    const welcomeMessages = [
      {
        groupName: 'General Discussion',
        message: 'Welcome to the Career Guidance Project! Feel free to ask any questions about career opportunities in technology.'
      },
      {
        groupName: 'Technical Q&A',
        message: 'This is the place to ask technical questions about programming, software development, and engineering concepts.'
      },
      {
        groupName: 'Project Collaboration',
        message: 'Use this space to collaborate on projects and share your work with fellow participants.'
      },
      {
        groupName: 'Industry Insights',
        message: 'Let\'s discuss the latest trends in technology and career opportunities in various industries.'
      }
    ]

    for (const welcomeMsg of welcomeMessages) {
      const group = allGroups.find(g => g.name === welcomeMsg.groupName)
      if (!group) continue

      // Check if message already exists
      const { data: existingMessage } = await supabase
        .from('group_messages')
        .select('id')
        .eq('group_id', group.id)
        .eq('sender_id', adminProfile.id)
        .eq('message', welcomeMsg.message)
        .single()

      if (existingMessage) {
        console.log(`Welcome message already exists in: ${group.name}`)
        continue
      }

      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          sender_id: adminProfile.id,
          message: welcomeMsg.message
        })

      if (messageError) {
        console.error(`Error adding welcome message to ${group.name}:`, messageError)
      } else {
        console.log(`✅ Added welcome message to: ${group.name}`)
      }
    }

    console.log('\n🎉 Group seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding groups:', error)
  }
}

seedGroups()