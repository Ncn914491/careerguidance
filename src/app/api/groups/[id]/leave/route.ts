import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const groupId = params.id;
  const token = request.headers.get('Authorization')?.split(' ')?.[1];

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const userId = user.id;

    // Check if user is a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking group membership:', memberCheckError);
      return NextResponse.json({ error: 'Failed to check group membership' }, { status: 500 });
    }

    if (!existingMember) {
      return NextResponse.json({ message: 'Not a member of this group' }, { status: 200 });
    }

    // Remove user from the group
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error leaving group:', deleteError);
      return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully left group' }, { status: 200 });
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}