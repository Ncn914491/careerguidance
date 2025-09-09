import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Use admin client to bypass RLS issues
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')?.[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Token verification failed:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('User role API: Getting role for user:', user.id, user.email);

    // Get user profile with admin client (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // If profile doesn't exist, return student role
      return NextResponse.json({ 
        role: 'student', 
        email: user.email,
        message: 'Profile not found, defaulting to student'
      });
    }

    console.log('User role API: Profile found:', profile);

    return NextResponse.json({
      role: profile.role || 'student',
      email: profile.email,
      full_name: profile.full_name
    });

  } catch (error) {
    console.error('Error in user role API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      role: 'student' // Default fallback
    }, { status: 500 });
  }
}
