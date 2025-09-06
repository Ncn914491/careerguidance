import { supabase } from './supabase'

/**
 * Check if user is the seeded admin
 */
export function isSeededAdmin(email: string): boolean {
  return email === 'nchaitanyanaidu@yahoo.com'
}

/**
 * Get current user from client-side for API requests
 */
export async function getCurrentUserFromRequest(request: Request) {
  try {
    // Get the session token from cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return { user: null, session: null }
    }

    // Parse cookies to find auth tokens
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    // Look for Supabase auth tokens
    const accessToken = cookies['sb-access-token'] || cookies['supabase-auth-token']
    const refreshToken = cookies['sb-refresh-token']

    if (!accessToken) {
      return { user: null, session: null }
    }

    // Set the session
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    })

    if (error || !session) {
      return { user: null, session: null }
    }

    return { user: session.user, session }
  } catch (error) {
    console.error('Error getting user from request:', error)
    return { user: null, session: null }
  }
}