import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

// Use admin client to bypass RLS issues temporarily
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    await requireAdmin();
    
    const { name, description } = await request.json();
    const groupId = params.id;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Group description is required' }, { status: 400 });
    }

    // Check if group exists
    const { data: existingGroup, error: checkError } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single();

    if (checkError || !existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Update the group
    const { data: group, error: updateError } = await supabaseAdmin
      .from('groups')
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating group:', updateError);
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error in groups PUT API:', error);
    
    if (error instanceof Error && error.message.includes('Admin privileges required')) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    await requireAdmin();
    
    const groupId = params.id;

    // Check if group exists
    const { data: existingGroup, error: checkError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .single();

    if (checkError || !existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Delete group members first (cascade delete)
    await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', groupId);

    // Delete group messages (if they exist)
    try {
      await supabaseAdmin
        .from('group_messages')
        .delete()
        .eq('group_id', groupId);
    } catch (error) {
      // Ignore if table doesn't exist
    }

    // Delete the group
    const { error: deleteError } = await supabaseAdmin
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('Error deleting group:', deleteError);
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Group "${existingGroup.name}" deleted successfully` 
    });
  } catch (error) {
    console.error('Error in groups DELETE API:', error);
    
    if (error instanceof Error && error.message.includes('Admin privileges required')) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}