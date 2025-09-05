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

// PATCH /api/admin/requests/[id] - Approve or deny admin request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isAdmin } = await getCurrentUser()
    
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { action } = await request.json()
    
    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "deny"' }, { status: 400 })
    }

    const resolvedParams = await params
    const requestId = resolvedParams.id

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

    if (adminRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 })
    }

    // Update the request status
    const newStatus = action === 'approve' ? 'approved' : 'denied'
    const { error: updateError } = await supabaseAdmin
      .from('admin_requests')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating admin request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // If approved, update the user's role to admin
    if (action === 'approve') {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminRequest.user_id)

      if (roleUpdateError) {
        console.error('Error updating user role:', roleUpdateError)
        // Revert the request status if role update fails
        await supabaseAdmin
          .from('admin_requests')
          .update({
            status: 'pending',
            reviewed_by: null,
            reviewed_at: null
          })
          .eq('id', requestId)
        
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
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