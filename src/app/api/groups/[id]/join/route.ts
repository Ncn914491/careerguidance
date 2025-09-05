import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth-client'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Check if group exists using admin client
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member using admin client
    const { data: existingMembership } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json({ message: 'Already a member of this group' })
    }

    // Add user to group using admin client
    const { error: joinError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id
      })

    if (joinError) {
      console.error('Error joining group:', joinError)
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Successfully joined ${group.name}`,
      group 
    })
  } catch (error) {
    console.error('Error in group join API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}