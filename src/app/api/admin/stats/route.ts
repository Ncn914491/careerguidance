import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Use admin client to bypass RLS for statistics
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

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user role from database using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Get total users count
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get students count
    const { count: totalStudents } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Get admins count
    const { count: totalAdmins } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    // Get total groups count
    const { count: totalGroups } = await supabaseAdmin
      .from('groups')
      .select('*', { count: 'exact', head: true });

    // Get total schools count
    const { count: totalSchools } = await supabaseAdmin
      .from('schools')
      .select('*', { count: 'exact', head: true });

    // Get total weeks count
    const { count: totalWeeks } = await supabaseAdmin
      .from('weeks')
      .select('*', { count: 'exact', head: true });

    // Get total visits count (assuming this is tracked somewhere)
    let totalVisits = 0;
    try {
      const { count } = await supabaseAdmin
        .from('school_visits')
        .select('*', { count: 'exact', head: true });
      totalVisits = count || 0;
    } catch {
      totalVisits = 0; // Fallback if table doesn't exist
    }

    // Get unique students in groups count
    let studentsInGroups = 0;
    try {
      const { data: uniqueStudents } = await supabaseAdmin
        .from('group_members')
        .select('user_id');
      
      if (uniqueStudents) {
        const uniqueUserIds = new Set(uniqueStudents.map(member => member.user_id));
        studentsInGroups = uniqueUserIds.size;
      }
    } catch {
      studentsInGroups = 0; // Fallback if table doesn't exist
    }

    const stats = {
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalAdmins: totalAdmins || 0,
      totalGroups: totalGroups || 0,
      totalSchools: totalSchools || 0,
      totalWeeks: totalWeeks || 0,
      totalVisits: totalVisits,
      studentsInGroups: studentsInGroups
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
