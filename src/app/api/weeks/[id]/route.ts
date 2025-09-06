import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUserFromRequest } from '@/lib/auth-client';

// PUT - Update week details (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, isAdmin } = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { title, description } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
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
  { params }: { params: { id: string } }
) {
  try {
    const { user, isAdmin } = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // First, get all files associated with this week
    const { data: weekFiles, error: filesError } = await supabase
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

      const { error: storageError } = await supabase.storage
        .from('weeks')
        .remove(filePaths);

      if (storageError) {
        console.warn('Error deleting files from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete week files records
    const { error: deleteFilesError } = await supabase
      .from('week_files')
      .delete()
      .eq('week_id', params.id);

    if (deleteFilesError) {
      console.error('Error deleting week files records:', deleteFilesError);
      return NextResponse.json({ error: 'Failed to delete week files' }, { status: 500 });
    }

    // Delete the week record
    const { error: deleteWeekError } = await supabase
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