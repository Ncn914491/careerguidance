import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

import { Database } from '@/lib/database.types'

// Server-side Supabase client with service role for admin operations
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

// PATCH /api/admin/requests/[id] - Approve or deny admin request
export async function PATCH(
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

    // Check user role from database using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile as { role: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { action } = await request.json()
    
    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "deny"' }, { status: 400 })
    }

    const params = await context.params;
    const requestId = params.id

    // First, get the request to check if it exists and is pending
    const { data: adminRequest, error: fetchError } = await supabaseAdmin
      .from('admin_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError) {
      console.error('Error fetching admin request:', fetchError)
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if ((adminRequest as { status: string }).status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 })
    }

    // Update the request status
    const newStatus = action === 'approve' ? 'approved' : 'denied'
    const updateData = {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('admin_requests')
      .update(updateData)
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating admin request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // Update user role based on action
    if (action === 'approve') {
      // Approve: pending_admin -> admin
      const { error: roleUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', (adminRequest as { user_id: string }).user_id)

      if (roleUpdateError) {
        console.error('Error updating user role to admin:', roleUpdateError)
        // Revert the request status if role update fails
        const revertData = {
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null
        }
        await supabaseAdmin
          .from('admin_requests')
          .update(revertData)
          .eq('id', requestId)
        
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
      }
    } else if (action === 'deny') {
      // Deny: pending_admin -> student
      const { error: roleUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', (adminRequest as { user_id: string }).user_id)

      if (roleUpdateError) {
        console.error('Error reverting user role to student:', roleUpdateError)
        // Don't fail the denial, but log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Request ${action}d successfully` 
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/requests/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
