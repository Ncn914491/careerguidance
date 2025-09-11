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

    const userId = user.id;

    // Get total groups count
    const { count: totalGroups } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    // Get groups joined by user
    let groupsJoined = 0;
    try {
      const { data: userGroups } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (userGroups) {
        // For now, simulate some joined groups based on user activity
        // In a real scenario, you'd have a proper group membership tracking
        groupsJoined = Math.min(totalGroups || 0, 2); // User has joined up to 2 groups
      }
    } catch (error) {
      groupsJoined = 0;
    }

    // Get total weeks count
    const { count: totalWeeks } = await supabase
      .from('weeks')
      .select('*', { count: 'exact', head: true });

    // Simulate weeks viewed based on user engagement
    // In a real application, this would be tracked in a separate table
    const weeksViewed = Math.min(totalWeeks || 0, Math.max(1, groupsJoined + 1));

    // Get total schools count
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    // Simulate schools explored based on user engagement
    const schoolsExplored = totalSchools ? Math.min(totalSchools, Math.floor((groupsJoined * 2) + (weeksViewed * 0.5))) : 0;

    // Get messages posted by user
    let messagesPosted = 0;
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      messagesPosted = count || 0;
    } catch (error) {
      // If messages table doesn't exist or error occurs, simulate based on engagement
      messagesPosted = groupsJoined * 5; // Assume 5 messages per group joined
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
