import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Test database connectivity and data
    const tests = {
      profiles: null as any,
      groups: null as any,
      weeks: null as any,
      messages: null as any
    };

    // Test profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);
    
    tests.profiles = {
      count: profiles?.length || 0,
      data: profiles,
      error: profilesError?.message
    };

    // Test groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, created_by')
      .limit(5);
    
    tests.groups = {
      count: groups?.length || 0,
      data: groups,
      error: groupsError?.message
    };

    // Test weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select('id, week_number, title')
      .limit(5);
    
    tests.weeks = {
      count: weeks?.length || 0,
      data: weeks,
      error: weeksError?.message
    };

    // Test messages
    const { data: messages, error: messagesError } = await supabase
      .from('group_messages')
      .select('id, group_id, sender_id')
      .limit(5);
    
    tests.messages = {
      count: messages?.length || 0,
      data: messages,
      error: messagesError?.message
    };

    return NextResponse.json({
      message: 'Database connectivity test',
      timestamp: new Date().toISOString(),
      tests
    });
  } catch (error) {
    console.error('Test auth API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}