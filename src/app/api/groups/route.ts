import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser, requireAdmin } from '@/lib/auth'

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
)

export async function GET() {
  try {
    // Get current user to check membership
    const { user } = await getCurrentUser();
    const userId = user?.id;

    // Get groups with member count and user membership status
    const { data: groups, error } = await supabaseAdmin
      .from('groups')
      .select(`
        id, 
        name, 
        description, 
        created_by, 
        created_at,
        group_members!inner(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    // Get user memberships if user is logged in
    let userMemberships: string[] = [];
    if (userId) {
      const { data: memberships } = await supabaseAdmin
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
      
      userMemberships = memberships?.map(m => m.group_id) || [];
    }

    // Process groups to add member count and membership status
    const processedGroups = await Promise.all(
      (groups || []).map(async (group) => {
        // Get actual member count
        const { count: memberCount } = await supabaseAdmin
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          created_at: group.created_at,
          member_count: memberCount || 0,
          is_member: userMemberships.includes(group.id)
        };
      })
    );

    return NextResponse.json({ groups: processedGroups })
  } catch (error) {
    console.error('Error in groups API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access for creating groups
    const { user } = await requireAdmin();
    
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    if (!description) {
      return NextResponse.json({ error: 'Group description is required' }, { status: 400 })
    }

    // Create the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single()

    if (groupError) {
      console.error('Error creating group:', groupError)
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error in groups POST API:', error)
    
    if (error instanceof Error && error.message.includes('Admin privileges required')) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}