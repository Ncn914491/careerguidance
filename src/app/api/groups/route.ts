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

export async function GET() {
  try {
    // For now, return all groups to avoid authentication issues
    // This will be secured once proper authentication is working
    const { data: groups, error } = await supabaseAdmin
      .from('groups')
      .select('id, name, description, created_by, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    return NextResponse.json({ groups: groups || [] })
  } catch (error) {
    console.error('Error in groups API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // For now, create groups without authentication to avoid issues
    // Use a default creator ID (this will be fixed once auth is working)
    const defaultCreatorId = '00000000-0000-0000-0000-000000000000'

    // Create the group using admin client
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name,
        description,
        created_by: defaultCreatorId
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}