import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Check user role from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || (profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get students count
    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Get admins count
    const { count: totalAdmins } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    // Get total groups count
    const { count: totalGroups } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    // Get total schools count
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    // Get total weeks count
    const { count: totalWeeks } = await supabase
      .from('weeks')
      .select('*', { count: 'exact', head: true });

    // Get total visits count (assuming this is tracked somewhere)
    let totalVisits = 0;
    try {
      const { count } = await supabase
        .from('school_visits')
        .select('*', { count: 'exact', head: true });
      totalVisits = count || 0;
    } catch (error) {
      totalVisits = 0; // Fallback if table doesn't exist
    }

    // Get students in groups count
    let studentsInGroups = 0;
    try {
      const { count } = await supabase
        .from('group_members')
        .select('user_id', { count: 'exact', head: true });
      studentsInGroups = count || 0;
    } catch (error) {
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

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
