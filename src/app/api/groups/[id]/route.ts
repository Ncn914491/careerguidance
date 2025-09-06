import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUserFromRequest } from '@/lib/auth-client';

// GET - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error checking group membership:', membershipError);
      return NextResponse.json({ error: 'Failed to check group access' }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, description, created_at')
      .eq('id', params.id)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error in GET /api/groups/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}