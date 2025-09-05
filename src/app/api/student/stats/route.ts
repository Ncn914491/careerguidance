import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { user } = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get total groups count
    const { count: totalGroups } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    // Get groups joined by user
    const { count: groupsJoined } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .catch(() => ({ count: 0 }));

    // Get total weeks count
    const { count: totalWeeks } = await supabase
      .from('weeks')
      .select('*', { count: 'exact', head: true });

    // Get weeks viewed by user (this would need to be tracked in a separate table)
    // For now, we'll use a placeholder or estimate
    const { count: weeksViewed } = await supabase
      .from('user_week_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .catch(() => ({ count: 0 }));

    // Get total schools count
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    // Get schools explored by user (placeholder)
    const { count: schoolsExplored } = await supabase
      .from('user_school_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .catch(() => ({ count: 0 }));

    // Get messages posted by user
    const { count: messagesPosted } = await supabase
      .from('group_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .catch(() => ({ count: 0 }));

    // Get active days (placeholder - would need proper tracking)
    const activeDays = Math.min(30, Math.max(1, (groupsJoined || 0) * 3 + (messagesPosted || 0)));

    const stats = {
      groupsJoined: groupsJoined || 0,
      totalGroups: totalGroups || 0,
      weeksViewed: weeksViewed || 0,
      totalWeeks: totalWeeks || 0,
      schoolsExplored: schoolsExplored || 0,
      totalSchools: totalSchools || 0,
      messagesPosted: messagesPosted || 0,
      activeDays
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}