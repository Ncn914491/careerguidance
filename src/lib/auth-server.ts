import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Get current user from server-side with cookies
 */
export async function getCurrentUserServer(request?: NextRequest) {
  try {
    const cookieStore = request ? {
      get(name: string) {
        return request.cookies.get(name)?.value
      }
    } : {
      get(name: string) {
        return cookies().get(name)?.value
      }
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieStore,
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return { user: null, isAdmin: false, session: null }
    }

    // Check if this is the seeded admin
    const isSeededAdmin = session.user.email === 'nchaitanyanaidu@yahoo.com'
    
    if (isSeededAdmin) {
      return { 
        user: session.user, 
        isAdmin: true,
        session,
        isSeededAdmin: true
      }
    }

    // Get user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    return {
      user: session.user,
      isAdmin: profile?.role === 'admin',
      session,
      isSeededAdmin: false
    }
  } catch (error) {
    console.error('Error getting current user from server:', error)
    return { user: null, isAdmin: false, session: null }
  }
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(request?: NextRequest) {
  const { user, session } = await getCurrentUserServer(request)
  
  if (!user || !session) {
    throw new Error('Authentication required')
  }
  
  return { user, session }
}

/**
 * Require admin privileges for API routes
 */
export async function requireAdminServer(request?: NextRequest) {
  const { user, isAdmin, session } = await getCurrentUserServer(request)
  
  if (!user || !session) {
    throw new Error('Authentication required')
  }
  
  if (!isAdmin) {
    throw new Error('Admin privileges required')
  }
  
  return { user, isAdmin, session }
}