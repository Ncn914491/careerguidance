import { supabase } from './supabase'

// Admin user credentials for seeding and bypass
export const ADMIN_CREDENTIALS = {
  email: 'nchaitanyanaidu@yahoo.com',
  password: 'adminncn@20'
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
      bypassUsed: false
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error }
  }
}

/**
 * Get current user session and role (server-side)
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return { user: null, isAdmin: false }
    }

    // Check if this is the seeded admin
    if (isSeededAdmin(session.user.email || '')) {
      return { 
        user: session.user, 
        isAdmin: true,
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
      return { user: session.user, isAdmin: false }
    }

    return {
      user: session.user,
      isAdmin: profile?.role === 'admin',
      isSeededAdmin: false
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, isAdmin: false }
  }
}

/**
 * Get current user from client-side (for API routes that need to work with cookies)
 */
export async function getCurrentUserFromRequest(request?: Request) {
  try {
    // Create a Supabase client that can read cookies
    const { createServerClient } = await import('@supabase/ssr')
    
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            if (!request) return undefined
            const cookies = request.headers.get('cookie')
            if (!cookies) return undefined
            
            const cookie = cookies
              .split(';')
              .find(c => c.trim().startsWith(`${name}=`))
            
            return cookie ? cookie.split('=')[1] : undefined
          },
        },
      }
    )

    const { data: { session }, error } = await supabaseServer.auth.getSession()
    
    if (error || !session) {
      return { user: null, isAdmin: false }
    }

    // Check if this is the seeded admin
    if (isSeededAdmin(session.user.email || '')) {
      return { 
        user: session.user, 
        isAdmin: true,
        isSeededAdmin: true
      }
    }

    return {
      user: session.user,
      isAdmin: false,
      isSeededAdmin: false
    }
  } catch (error) {
    console.error('Error getting current user from request:', error)
    return { user: null, isAdmin: false }
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