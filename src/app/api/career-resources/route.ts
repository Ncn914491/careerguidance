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

// GET - Fetch all career resources with their files
export async function GET() {
  try {
    const { data: careerResources, error } = await supabaseAdmin
      .from('career_resources')
      .select(`
        *,
        career_resource_files (*)
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching career resources:', error);
      return NextResponse.json({ error: 'Failed to fetch career resources' }, { status: 500 });
    }

    return NextResponse.json({ careerResources });
  } catch (error) {
    console.error('Error in GET /api/career-resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new career resource (admin only)
export async function POST(request: NextRequest) {
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

    if (!title?.trim() || !resource_type) {
      return NextResponse.json({ error: 'Title and resource type are required' }, { status: 400 });
    }

    const insertData = {
      title: title.trim(),
      description: description?.trim() || null,
      resource_type,
      content_text: content_text?.trim() || null,
      display_order: display_order || 0,
      is_featured: is_featured || false,
      created_by: user.id,
      updated_by: user.id
    };

    const { data, error } = await supabaseAdmin
      .from('career_resources')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating career resource:', error);
      return NextResponse.json({ error: 'Failed to create career resource' }, { status: 500 });
    }

    return NextResponse.json({ careerResource: data });
  } catch (error) {
    console.error('Error in POST /api/career-resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
