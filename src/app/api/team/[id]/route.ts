import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// PUT - Update team member information (admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { getUserFromAuthHeader } = await import('@/lib/auth-client');
    const authHeader = request.headers.get('Authorization');
    const { user } = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user role from database using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { name, position, bio } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Team member name is required' }, { status: 400 });
    }

    const params = await context.params;
    const updateData: Record<string, string | null> = {
      name: name.trim(),
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (position !== undefined) {
      updateData.position = position?.trim() || null;
    }
    if (bio !== undefined) {
      updateData.bio = bio?.trim() || null;
    }

    const { data, error } = await supabaseAdmin
      .from('team_members')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team member:', error);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    return NextResponse.json({ teamMember: data });
  } catch (error) {
    console.error('Error in PUT /api/team/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete team member (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { getUserFromAuthHeader } = await import('@/lib/auth-client');
    const authHeader = request.headers.get('Authorization');
    const { user } = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user role from database using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const params = await context.params;
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting team member:', error);
      return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/team/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
