import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

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
    const { count: totalVisits } = await supabase
      .from('school_visits')
      .select('*', { count: 'exact', head: true })
      .catch(() => ({ count: 0 })); // Fallback if table doesn't exist

    // Get students in groups count
    const { count: studentsInGroups } = await supabase
      .from('group_members')
      .select('user_id', { count: 'exact', head: true })
      .catch(() => ({ count: 0 })); // Fallback if table doesn't exist

    const stats = {
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalAdmins: totalAdmins || 0,
      totalGroups: totalGroups || 0,
      totalSchools: totalSchools || 0,
      totalWeeks: totalWeeks || 0,
      totalVisits: totalVisits || 0,
      studentsInGroups: studentsInGroups || 0
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