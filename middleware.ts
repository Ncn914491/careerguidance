import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/', '/schools', '/weeks', '/team'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated, check role-based access
  if (session) {
    const userId = session.user.id;
    const userEmail = session.user.email || '';

    // Check if user is seeded admin
    const isSeededAdmin = userEmail === 'nchaitanyanaidu@yahoo.com';
    
    let isAdmin = isSeededAdmin;
    
    // If not seeded admin, check role from database with caching
    if (!isSeededAdmin) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        isAdmin = profile?.role === 'admin';
      } catch (error) {
        console.error('Error checking user role:', error);
        isAdmin = false;
      }
    }

    // Admin route protection
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        // Redirect non-admin users to student dashboard
        return NextResponse.redirect(new URL('/student/dashboard', req.url));
      }
    }

    // Student route protection (redirect admins to admin dashboard if they try to access student routes)
    if (pathname.startsWith('/student') && isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    // Redirect authenticated users from login page to appropriate dashboard
    if (pathname === '/login') {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/student/dashboard', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};