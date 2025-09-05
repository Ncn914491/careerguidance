import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Admin user credentials for seeding and bypass
export const ADMIN_CREDENTIALS = {
  email: 'nchaitanyanaidu@yahoo.com',
  password: 'adminncn@20'
}

// Server-side Supabase client with service role for admin operations
// Note: This should only be used in server-side contexts (API routes)
const supabaseAdmin = typeof window === 'undefined' ? createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null

/**
 * Create the admin user in Supabase Auth and profiles table
 */
export async function seedAdminUser() {
  if (!supabaseAdmin) {
    throw new Error('Admin operations can only be performed server-side')
  }

  try {
    // First, try to create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      email_confirm: true // Skip email confirmation for seeded admin
    })

    if (authError && !authError.message.includes('already registered')) {
      console.error('Error creating admin user in auth:', authError)
      throw authError
    }

    const userId = authData?.user?.id

    if (userId) {
      // Create or update the profile with admin role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: ADMIN_CREDENTIALS.email,
          full_name: 'Chaitanya Naidu',
          role: 'admin'
        })

      if (profileError) {
        console.error('Error creating admin profile:', profileError)
        throw profileError
      }

      console.log('Admin user seeded successfully:', ADMIN_CREDENTIALS.email)
      return { success: true, userId }
    }

    return { success: true, message: 'Admin user already exists' }
  } catch (error) {
    console.error('Failed to seed admin user:', error)
    return { success: false, error }
  }
}

/**
 * Check if a user is the seeded admin user
 */
export function isSeededAdmin(email: string): boolean {
  return email === ADMIN_CREDENTIALS.email
}

/**
 * Authenticate user with bypass for seeded admin
 */
export async function authenticateUser(email: string, password: string) {
  try {
    // Check if this is the seeded admin user
    if (isSeededAdmin(email) && password === ADMIN_CREDENTIALS.password) {
      // For the seeded admin, we'll use a special bypass authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Admin authentication error:', error)
        return { success: false, error }
      }

      return { 
        success: true, 
        user: data.user,
        isAdmin: true,
        bypassUsed: true
      }
    }

    // For regular users, use normal authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error }
    }

    // Check user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { success: false, error: profileError }
    }

    return {
      success: true,
      user: data.user,
      isAdmin: profile?.role === 'admin',
      isPendingAdmin: profile?.role === 'pending_admin',
      bypassUsed: false
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error }
  }
}

/**
 * Get current user session and role
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return { user: null, isAdmin: false, isPendingAdmin: false }
    }

    // Check if this is the seeded admin
    if (isSeededAdmin(session.user.email || '')) {
      return { 
        user: session.user, 
        isAdmin: true,
        isPendingAdmin: false,
        isSeededAdmin: true
      }
    }

    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { user: session.user, isAdmin: false, isPendingAdmin: false }
    }

    return {
      user: session.user,
      isAdmin: profile?.role === 'admin',
      isPendingAdmin: profile?.role === 'pending_admin',
      isSeededAdmin: false
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, isAdmin: false, isPendingAdmin: false }
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      return { success: false, error }
    }
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error }
  }
}

/**
 * Check if user has admin privileges
 */
export async function requireAdmin() {
  const { user, isAdmin } = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (!isAdmin) {
    throw new Error('Admin privileges required')
  }
  
  return { user, isAdmin }
}

/**
 * Create a new user profile after signup
 */
export async function createUserProfile(userId: string, email: string, fullName?: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'student' // Default role for new users
      })

    if (error) {
      console.error('Error creating user profile:', error)
      return { success: false, error }
    }

    // Add user to default groups
    const { addUserToDefaultGroups } = await import('./groups')
    await addUserToDefaultGroups(userId)

    return { success: true }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error }
  }
}