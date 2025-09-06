#!/usr/bin/env node

/**
 * Career Guidance Platform - System Setup Script
 * 
 * This script initializes the database and creates the default admin user.
 * Run this after setting up your environment variables.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Environment validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
}

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.log(`   - ${varName}`))
  console.log('\nPlease add these to your .env.local file')
  process.exit(1)
}

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Default admin credentials
const ADMIN_CREDENTIALS = {
  email: 'nchaitanyanaidu@yahoo.com',
  password: 'adminncn@20',
  fullName: 'System Administrator'
}

// Default groups to create
const DEFAULT_GROUPS = [
  {
    name: 'General Discussion',
    description: 'General discussions about career guidance and opportunities'
  },
  {
    name: 'Technical Q&A',
    description: 'Technical questions and answers about various career paths'
  },
  {
    name: 'Project Collaboration',
    description: 'Collaborate on projects and share experiences'
  }
]

async function setupSystem() {
  console.log('🎓 Career Guidance Platform - System Setup')
  console.log('==========================================\n')

  try {
    // Step 1: Create admin user
    console.log('📝 Step 1: Setting up admin user...')
    const adminUserId = await setupAdminUser()
    
    // Step 2: Create admin profile
    console.log('\n👤 Step 2: Creating admin profile...')
    await setupAdminProfile(adminUserId)
    
    // Step 3: Create default groups
    console.log('\n💬 Step 3: Setting up default groups...')
    await setupDefaultGroups(adminUserId)
    
    // Step 4: Verify setup
    console.log('\n✅ Step 4: Verifying system setup...')
    await verifySetup()
    
    // Success message
    console.log('\n🎉 System setup completed successfully!')
    console.log('\n📋 Admin Login Credentials:')
    console.log(`   📧 Email: ${ADMIN_CREDENTIALS.email}`)
    console.log(`   🔑 Password: ${ADMIN_CREDENTIALS.password}`)
    console.log('\n🚀 Next steps:')
    console.log('   1. Start the development server: npm run dev')
    console.log('   2. Open http://localhost:3000 in your browser')
    console.log('   3. Login with the admin credentials above')

  } catch (error) {
    console.error('\n❌ System setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check your environment variables in .env.local')
    console.log('   2. Ensure your Supabase project is properly configured')
    console.log('   3. Verify your database tables exist')
    process.exit(1)
  }
}

async function setupAdminUser() {
  // Check if admin user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingAdmin = existingUsers.users.find(u => u.email === ADMIN_CREDENTIALS.email)
  
  if (existingAdmin) {
    console.log('   ✅ Admin user already exists')
    return existingAdmin.id
  }

  // Create new admin user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_CREDENTIALS.email,
    password: ADMIN_CREDENTIALS.password,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN_CREDENTIALS.fullName
    }
  })

  if (authError) {
    throw new Error(`Failed to create admin user: ${authError.message}`)
  }

  console.log('   ✅ Admin user created successfully')
  return authData.user.id
}

async function setupAdminProfile(adminUserId) {
  // Check if profile exists
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', adminUserId)
    .single()

  if (existingProfile) {
    // Update existing profile to ensure admin role
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'admin',
        full_name: ADMIN_CREDENTIALS.fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUserId)

    if (updateError) {
      throw new Error(`Failed to update admin profile: ${updateError.message}`)
    }
    console.log('   ✅ Admin profile updated')
  } else {
    // Create new profile
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: adminUserId,
        email: ADMIN_CREDENTIALS.email,
        full_name: ADMIN_CREDENTIALS.fullName,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      throw new Error(`Failed to create admin profile: ${insertError.message}`)
    }
    console.log('   ✅ Admin profile created')
  }
}

async function setupDefaultGroups(adminUserId) {
  let createdCount = 0
  let existingCount = 0

  for (const group of DEFAULT_GROUPS) {
    const { data: existingGroup } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('name', group.name)
      .single()

    if (!existingGroup) {
      const { data: newGroup, error: groupError } = await supabaseAdmin
        .from('groups')
        .insert({
          name: group.name,
          description: group.description,
          created_by: adminUserId
        })
        .select()
        .single()

      if (groupError) {
        throw new Error(`Failed to create group "${group.name}": ${groupError.message}`)
      }

      // Add admin to the group
      await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: adminUserId
        })

      console.log(`   ✅ Created group: ${group.name}`)
      createdCount++
    } else {
      console.log(`   ✅ Group "${group.name}" already exists`)
      existingCount++
    }
  }

  console.log(`   📊 Summary: ${createdCount} created, ${existingCount} existing`)
}

async function verifySetup() {
  // Verify admin profiles
  const { data: adminProfiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('role', 'admin')

  if (profileError) {
    throw new Error(`Failed to verify profiles: ${profileError.message}`)
  }

  // Verify groups
  const { data: groups, error: groupError } = await supabaseAdmin
    .from('groups')
    .select('*')

  if (groupError) {
    throw new Error(`Failed to verify groups: ${groupError.message}`)
  }

  console.log(`   ✅ Admin profiles: ${adminProfiles?.length || 0}`)
  console.log(`   ✅ Discussion groups: ${groups?.length || 0}`)
  console.log('   ✅ Database connection: Working')
  console.log('   ✅ Authentication: Configured')
}

// Run the setup
setupSystem()