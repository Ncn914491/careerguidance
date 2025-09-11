import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET - Fetch single career resource with files
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { data: careerResource, error } = await supabaseAdmin
      .from('career_resources')
      .select(`
        *,
        career_resource_files (*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching career resource:', error);
      return NextResponse.json({ error: 'Career resource not found' }, { status: 404 });
    }

    return NextResponse.json({ careerResource });
  } catch (error) {
    console.error('Error in GET /api/career-resources/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update career resource (admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { getUserFromAuthHeader } = await import('@/lib/auth-client');
    const authHeader = request.headers.get('Authorization');
    const { user } = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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

    const { title, description, resource_type, content_text, display_order, is_featured } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const params = await context.params;
    const updateData: {
      title: string;
      updated_by: string;
      description?: string | null;
      resource_type?: string;
      content_text?: string | null;
      display_order?: number;
      is_featured?: boolean;
    } = {
      title: title.trim(),
      updated_by: user.id
    };

    // Add optional fields if provided
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (resource_type !== undefined) {
      updateData.resource_type = resource_type;
    }
    if (content_text !== undefined) {
      updateData.content_text = content_text?.trim() || null;
    }
    if (display_order !== undefined) {
      updateData.display_order = display_order;
    }
    if (is_featured !== undefined) {
      updateData.is_featured = is_featured;
    }

    const { data, error } = await supabaseAdmin
      .from('career_resources')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating career resource:', error);
      return NextResponse.json({ error: 'Failed to update career resource' }, { status: 500 });
    }

    return NextResponse.json({ careerResource: data });
  } catch (error) {
    console.error('Error in PUT /api/career-resources/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete career resource and its files (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { getUserFromAuthHeader } = await import('@/lib/auth-client');
    const authHeader = request.headers.get('Authorization');
    const { user } = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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

    // First, get the career resource and its files to delete from storage
    const { data: careerResource, error: fetchError } = await supabaseAdmin
      .from('career_resources')
      .select(`
        *,
        career_resource_files (*)
      `)
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Career resource not found' }, { status: 404 });
    }

    // Delete files from Supabase storage
    if (careerResource.career_resource_files && careerResource.career_resource_files.length > 0) {

      // Delete from different buckets based on file type
      for (const file of careerResource.career_resource_files) {
        const bucketName = file.file_type === 'photo' ? 'career-photos' : 
                          file.file_type === 'pdf' ? 'career-pdfs' : 
                          file.file_type === 'ppt' ? 'career-ppts' : null;
        
        if (bucketName) {
          const fileName = new URL(file.file_url).pathname.split('/').pop();
          if (fileName) {
            await supabaseAdmin.storage.from(bucketName).remove([fileName]);
          }
        }
      }
    }

    // Delete the career resource (files will cascade delete due to foreign key)
    const { error } = await supabaseAdmin
      .from('career_resources')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting career resource:', error);
      return NextResponse.json({ error: 'Failed to delete career resource' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/career-resources/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
