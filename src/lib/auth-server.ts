import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client for profile lookups
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Get current user from server-side with cookies
 */
export async function getCurrentUserServer(request?: NextRequest) {
  try {
    // First try to get from cookies using the proper method
    let cookieStore: any
    
    if (request) {
      // For API routes with request object
      cookieStore = {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {}
      }
    } else {
      // For server components
      const cookiesStore = await cookies()
      cookieStore = {
        get(name: string) {
          return cookiesStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookiesStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookiesStore.delete(name)
        }
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
      console.log('No session found, trying alternative methods...')
      
      // Try to extract from cookie header directly
      if (request) {
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
          console.log('Found cookie header, parsing...')
          
          // Parse cookies manually with better handling
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, ...valueParts] = cookie.trim().split('=')
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=') // Handle values with = in them
              try {
                acc[key] = decodeURIComponent(value)
              } catch {
                acc[key] = value // Fallback if decoding fails
              }
            }
            return acc
          }, {} as Record<string, string>)

          console.log('Available cookies:', Object.keys(cookies))

          // Look for Supabase auth tokens with various possible names
          const possibleTokenNames = [
            'sb-career-guidance-auth-token',
            'sb-localhost-auth-token',
            'sb-access-token',
            'supabase-auth-token',
            'career-guidance-auth'
          ]

          let accessToken = null
          let refreshToken = null
          
          for (const tokenName of possibleTokenNames) {
            if (cookies[tokenName]) {
              accessToken = cookies[tokenName]
              console.log(`Found access token with key: ${tokenName}`)
              break
            }
          }
          
          // Also look for refresh token
          const refreshTokenNames = [
            'sb-career-guidance-refresh-token',
            'sb-localhost-refresh-token',
            'sb-refresh-token',
            'supabase-refresh-token'
          ]
          
          for (const tokenName of refreshTokenNames) {
            if (cookies[tokenName]) {
              refreshToken = cookies[tokenName]
              console.log(`Found refresh token with key: ${tokenName}`)
              break
            }
          }

          if (accessToken) {
            console.log('Found access token, verifying user...')
            try {
              // Create a new supabase client for this request
              const requestSupabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                  cookies: {
                    get(name: string) {
                      return cookies[name]
                    },
                    set() {},
                    remove() {}
                  }
                }
              )
              
              // Try to set session first if we have both tokens
              if (refreshToken) {
                const { data: sessionData, error: sessionError } = await requestSupabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                })
                
                if (!sessionError && sessionData.session?.user) {
                  console.log('Session restored for user:', sessionData.session.user.email)
                  
                  const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('role')
                    .eq('id', sessionData.session.user.id)
                    .single()

                  return {
                    user: sessionData.session.user,
                    isAdmin: sessionData.session.user.email === 'nchaitanyanaidu@yahoo.com' || profile?.role === 'admin',
                    session: sessionData.session,
                    isSeededAdmin: sessionData.session.user.email === 'nchaitanyanaidu@yahoo.com'
                  }
                }
              }
              
              // Fallback to getUser with access token
              const { data: { user }, error: userError } = await requestSupabase.auth.getUser(accessToken)
              if (!userError && user) {
                console.log('User verified from token:', user.email)
                
                const { data: profile } = await supabaseAdmin
                  .from('profiles')
                  .select('role')
                  .eq('id', user.id)
                  .single()

                return {
                  user,
                  isAdmin: user.email === 'nchaitanyanaidu@yahoo.com' || profile?.role === 'admin',
                  session: null,
                  isSeededAdmin: user.email === 'nchaitanyanaidu@yahoo.com'
                }
              }
            } catch (tokenError) {
              console.error('Error verifying token:', tokenError)
            }
          } else {
            console.log('No access token found in cookies')
          }
        } else {
          console.log('No cookie header found')
        }
      }
      
      console.log('No valid authentication found')
      return { user: null, isAdmin: false, session: null }
    }

    console.log('Session found for user:', session.user.email)

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

    // Get user role from profiles table using admin client
    const { data: profile } = await supabaseAdmin
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