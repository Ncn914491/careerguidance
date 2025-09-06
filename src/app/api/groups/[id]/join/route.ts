import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUserServer } from '@/lib/auth-server'

// Use admin client to bypass RLS issues
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
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentUserServer(request)
    
    if (!user) {
      console.error('No user found in join request')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('User joining group:', { userId: user.id, email: user.email, groupId: params.id })

    const groupId = params.id

    // Check if group exists
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error('Group not found:', groupError)
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipCheckError) {
      console.error('Error checking membership:', membershipCheckError)
    }

    if (existingMembership) {
      return NextResponse.json({ 
        message: `Already a member of ${group.name}`,
        group_id: groupId,
        already_member: true
      })
    }

    // Add user to group
    const { error: joinError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id
      })

    if (joinError) {
      console.error('Error joining group:', joinError)
      return NextResponse.json({ error: 'Failed to join group: ' + joinError.message }, { status: 500 })
    }

    console.log('Successfully joined group:', { userId: user.id, groupId, groupName: group.name })

    return NextResponse.json({ 
      message: `Successfully joined ${group.name}`,
      group_id: groupId,
      success: true
    })
  } catch (error) {
    console.error('Error in POST /api/groups/[id]/join:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}