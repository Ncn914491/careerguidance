import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Use admin client to test data access
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
    let user = null;

    if (token) {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && authUser) {
        user = authUser;
      }
    }

    // Test data access with different methods
    const results = {
      user: user ? { id: user.id, email: user.email } : null,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Admin access to weeks
    try {
      const { data: weeksAdmin, error: weeksAdminError } = await supabaseAdmin
        .from('weeks')
        .select('id, week_number, title')
        .limit(5);
      
      results.tests.weeksAdmin = {
        success: !weeksAdminError,
        count: weeksAdmin?.length || 0,
        error: weeksAdminError?.message
      };
    } catch (error) {
      results.tests.weeksAdmin = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: User access to weeks (if authenticated)
    if (user) {
      try {
        const { data: weeksUser, error: weeksUserError } = await supabase
          .from('weeks')
          .select('id, week_number, title')
          .limit(5);
        
        results.tests.weeksUser = {
          success: !weeksUserError,
          count: weeksUser?.length || 0,
          error: weeksUserError?.message
        };
      } catch (error) {
        results.tests.weeksUser = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 3: Admin access to groups
    try {
      const { data: groupsAdmin, error: groupsAdminError } = await supabaseAdmin
        .from('groups')
        .select('id, name')
        .limit(5);
      
      results.tests.groupsAdmin = {
        success: !groupsAdminError,
        count: groupsAdmin?.length || 0,
        error: groupsAdminError?.message
      };
    } catch (error) {
      results.tests.groupsAdmin = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 4: User access to groups (if authenticated)
    if (user) {
      try {
        const { data: groupsUser, error: groupsUserError } = await supabase
          .from('groups')
          .select('id, name')
          .limit(5);
        
        results.tests.groupsUser = {
          success: !groupsUserError,
          count: groupsUser?.length || 0,
          error: groupsUserError?.message
        };
      } catch (error) {
        results.tests.groupsUser = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 5: Profile access (if authenticated)
    if (user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', user.id)
          .single();
        
        results.tests.profile = {
          success: !profileError,
          data: profile,
          error: profileError?.message
        };
      } catch (error) {
        results.tests.profile = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}