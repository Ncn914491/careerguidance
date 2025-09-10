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

// PUT - Update week details (admin only)
export async function PUT(
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { title, description } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const params = await context.params;
    const { data, error } = await supabaseAdmin
      .from('weeks')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating week:', error);
      return NextResponse.json({ error: 'Failed to update week' }, { status: 500 });
    }

    return NextResponse.json({ week: data });
  } catch (error) {
    console.error('Error in PUT /api/weeks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete week and associated files (admin only)
export async function DELETE(
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const params = await context.params;
    
    // First, get all files associated with this week
    const { data: weekFiles, error: filesError } = await supabaseAdmin
      .from('week_files')
      .select('file_url')
      .eq('week_id', params.id);

    if (filesError) {
      console.error('Error fetching week files:', filesError);
      return NextResponse.json({ error: 'Failed to fetch week files' }, { status: 500 });
    }

    // Delete files from storage
    if (weekFiles && weekFiles.length > 0) {
      const filePaths = weekFiles.map(file => {
        // Extract the file path from the URL
        const url = new URL(file.file_url);
        const pathParts = url.pathname.split('/');
        // Remove the first empty part and 'storage/v1/object/public/weeks/'
        return pathParts.slice(5).join('/');
      });

      // Try to delete from appropriate buckets (week-photos, week-pdfs, week-videos)
      const buckets = ['week-photos', 'week-pdfs', 'week-videos'];
      for (const bucket of buckets) {
        const bucketFiles = filePaths.filter(path => {
          // Determine bucket based on file path or type
          if (bucket === 'week-photos' && (path.includes('.jpg') || path.includes('.png') || path.includes('.jpeg'))) return true;
          if (bucket === 'week-pdfs' && path.includes('.pdf')) return true;
          if (bucket === 'week-videos' && (path.includes('.mp4') || path.includes('.mov'))) return true;
          return false;
        });
        
        if (bucketFiles.length > 0) {
          const { error: storageError } = await supabaseAdmin.storage
            .from(bucket)
            .remove(bucketFiles);

          if (storageError) {
            console.warn(`Error deleting files from ${bucket}:`, storageError);
            // Continue with database deletion even if storage deletion fails
          }
        }
      }
    }

    // Delete week files records
    const { error: deleteFilesError } = await supabaseAdmin
      .from('week_files')
      .delete()
      .eq('week_id', params.id);

    if (deleteFilesError) {
      console.error('Error deleting week files records:', deleteFilesError);
      return NextResponse.json({ error: 'Failed to delete week files' }, { status: 500 });
    }

    // Delete the week record
    const { error: deleteWeekError } = await supabaseAdmin
      .from('weeks')
      .delete()
      .eq('id', params.id);

    if (deleteWeekError) {
      console.error('Error deleting week:', deleteWeekError);
      return NextResponse.json({ error: 'Failed to delete week' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/weeks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}