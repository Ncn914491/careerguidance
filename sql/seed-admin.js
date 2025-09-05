/**
 * Admin User Seeding Script
 * 
 * This script creates the admin user with the specified credentials
 * and sets up the profile with admin role.
 * 
 * Run this script after setting up the database schema.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const ADMIN_CREDENTIALS = {
  email: 'nchaitanyanaidu@yahoo.com',
  password: 'adminncn@20'
}

async function seedAdminUser() {
  // Create admin client with service role
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    console.log('🌱 Seeding admin user...')

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      email_confirm: true // Skip email confirmation
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('ℹ️  Admin user already exists in auth system')
        
        // Get existing user
        const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
          filter: `email.eq.${ADMIN_CREDENTIALS.email}`
        })
        
        if (getUserError) {
          throw getUserError
        }
        
        if (existingUser?.users && existingUser.users.length > 0) {
          const user = existingUser.users[0]
          // Update profile to ensure admin role
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: user.id,
              email: ADMIN_CREDENTIALS.email,
              full_name: 'Chaitanya Naidu',
              role: 'admin'
            })

          if (profileError) {
            throw profileError
          }

          console.log('✅ Admin profile updated successfully')
          console.log(`📧 Email: ${ADMIN_CREDENTIALS.email}`)
          console.log(`🔑 Password: ${ADMIN_CREDENTIALS.password}`)
          console.log(`👤 User ID: ${user.id}`)
          return
        }
      } else {
        throw authError
      }
    }

    const userId = authData?.user?.id

    if (!userId) {
      throw new Error('Failed to get user ID from auth creation')
    }

    // Create profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: ADMIN_CREDENTIALS.email,
        full_name: 'Chaitanya Naidu',
        role: 'admin'
      })

    if (profileError) {
      throw profileError
    }

    console.log('✅ Admin user seeded successfully!')
    console.log(`📧 Email: ${ADMIN_CREDENTIALS.email}`)
    console.log(`🔑 Password: ${ADMIN_CREDENTIALS.password}`)
    console.log(`👤 User ID: ${userId}`)

  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message)
    process.exit(1)
  }
}

// Run the seeding function
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      console.log('🎉 Admin seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedAdminUser }