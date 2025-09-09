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

// GET - Fetch messages for a group
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
    const groupId = params.id;

    // Check if user is a member of the group
    const { data: membership } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member to view messages' }, { status: 403 });
    }

    // Fetch messages with sender profile information
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('group_messages')
      .select(`
        id,
        message,
        created_at,
        sender_id,
        profiles!group_messages_sender_id_fkey (
          full_name,
          email
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a message to a group
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
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Check if user is a member of the group
    const { data: membership } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member to send messages' }, { status: 403 });
    }

    // Send the message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        message: message.trim()
      })
      .select(`
        id,
        message,
        created_at,
        sender_id,
        profiles!group_messages_sender_id_fkey (
          full_name,
          email
        )
      `)
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Broadcast the message to other clients (optional - for real-time updates)
    try {
      await supabaseAdmin.channel(`group-channel:${groupId}`)
        .send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMessage
        });
    } catch (broadcastError) {
      console.warn('Failed to broadcast message:', broadcastError);
      // Don't fail the request if broadcasting fails
    }

    return NextResponse.json({ 
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error in POST messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}