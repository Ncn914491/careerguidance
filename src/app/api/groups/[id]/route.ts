import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Use admin client for role checks and admin operations
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

// GET - Get group details
export async function GET(
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

// PUT - Update a group
export async function PUT(
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

    // Check user role from database using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || (profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const params = await context.params;
    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const { data: group, error } = await supabase
      .from('groups')
      .update({ name, description })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error in PUT /api/groups/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a group
export async function DELETE(
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

    // Check user role from database using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || (profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const params = await context.params;
    
    // Use admin client for deletion to bypass RLS
    const { error } = await supabaseAdmin.from('groups').delete().eq('id', params.id);

    if (error) {
      console.error('Error deleting group:', error);
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/groups/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
