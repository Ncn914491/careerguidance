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
    let groupsJoined = 0;
    try {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      groupsJoined = count || 0;
    } catch (error) {
      groupsJoined = 0;
    }

    // Get total weeks count
    const { count: totalWeeks } = await supabase
      .from('weeks')
      .select('*', { count: 'exact', head: true });

    // Get weeks viewed by user (this would need to be tracked in a separate table)
    // For now, we'll use a placeholder or estimate
    let weeksViewed = 0;
    try {
      const { count } = await supabase
        .from('user_week_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      weeksViewed = count || 0;
    } catch (error) {
      weeksViewed = 0;
    }

    // Get total schools count
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    // Get schools explored by user (placeholder)
    let schoolsExplored = 0;
    try {
      const { count } = await supabase
        .from('user_school_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      schoolsExplored = count || 0;
    } catch (error) {
      schoolsExplored = 0;
    }

    // Get messages posted by user
    let messagesPosted = 0;
    try {
      const { count } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      messagesPosted = count || 0;
    } catch (error) {
      messagesPosted = 0;
    }

    // Get active days (placeholder - would need proper tracking)
    const activeDays = Math.min(30, Math.max(1, groupsJoined * 3 + messagesPosted));

    const stats = {
      groupsJoined,
      totalGroups: totalGroups || 0,
      weeksViewed,
      totalWeeks: totalWeeks || 0,
      schoolsExplored,
      totalSchools: totalSchools || 0,
      messagesPosted,
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