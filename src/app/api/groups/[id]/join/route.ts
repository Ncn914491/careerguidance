import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Use admin client for database operations
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')?.[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const groupId = params.id;

    // Check if group exists
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 });
    }

    // Add user to group
    const { error: joinError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member'
      });

    if (joinError) {
      console.error('Error joining group:', joinError);
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully joined ${group.name}`,
      group_id: groupId
    });
  } catch (error) {
    console.error('Error in group join API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}