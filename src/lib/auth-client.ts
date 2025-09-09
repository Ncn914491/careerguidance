import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest } from 'next/server'

/**
 * Check if user is the seeded admin
 */
export function isSeededAdmin(email: string): boolean {
  return email === 'nchaitanyanaidu@yahoo.com'
}

/**
 * Get current user from server-side request using proper SSR client
 */
export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No-op for read-only operations
          },
          remove(name: string, options: CookieOptions) {
            // No-op for read-only operations
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return { user: null, session: null }
    }

    return { user: session.user, session }
  } catch (error) {
    console.error('Error getting user from request:', error)
    return { user: null, session: null }
  }
}

/**
 * Get user from Authorization header (for API routes)
 */
export async function getUserFromAuthHeader(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, session: null }
  }

  const token = authHeader.split(' ')[1]
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, session: null }
    }

    return { user, session: null }
  } catch (error) {
    console.error('Error getting user from auth header:', error)
    return { user: null, session: null }
  }
}