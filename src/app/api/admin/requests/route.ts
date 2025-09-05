import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

// Server-side Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET /api/admin/requests - Fetch admin requests
export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // If user is admin, return all requests; if student, return only their requests
    let query = supabaseAdmin
      .from('admin_requests')
      .select(`
        *,
        profiles!admin_requests_user_id_fkey(full_name, email),
        reviewer:profiles!admin_requests_reviewed_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching admin requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in GET /api/admin/requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/requests - Create new admin request
export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { reason } = await request.json()

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Check if user already has a pending request
    const { data: existingRequest, error: checkError } = await supabaseAdmin
      .from('admin_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing requests:', checkError)
      return NextResponse.json({ error: 'Failed to check existing requests' }, { status: 500 })
    }

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending admin request' }, { status: 400 })
    }

    // Create new admin request and update user role to pending_admin
    const { data: newRequest, error } = await supabaseAdmin
      .from('admin_requests')
      .insert({
        user_id: user.id,
        reason: reason.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin request:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    // Update user role to pending_admin (this will be handled by the database trigger)
    // But we'll also do it explicitly here for immediate consistency
    const { error: roleError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'pending_admin' })
      .eq('id', user.id)
      .eq('role', 'student') // Only update if currently a student

    if (roleError) {
      console.error('Error updating user role to pending_admin:', roleError)
      // Don't fail the request creation, as the trigger should handle this
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}