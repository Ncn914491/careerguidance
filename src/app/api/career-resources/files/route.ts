import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

// POST - Upload files for career resource (admin only)
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

    const formData = await request.formData();
    const careerResourceId = formData.get('career_resource_id') as string;
    const files = formData.getAll('files') as File[];

    if (!careerResourceId) {
      return NextResponse.json({ error: 'Career resource ID is required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Determine file type and bucket
      let fileType: 'photo' | 'pdf' | 'ppt';
      let bucketName: string;

      if (file.type.startsWith('image/')) {
        fileType = 'photo';
        bucketName = 'career-photos';
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf';
        bucketName = 'career-pdfs';
      } else if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
        fileType = 'ppt';
        bucketName = 'career-ppts';
      } else {
        console.warn(`Unsupported file type: ${file.type}, defaulting to PDF`);
        fileType = 'pdf';
        bucketName = 'career-pdfs';
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${uuidv4()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ error: `Failed to upload ${file.name}` }, { status: 500 });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      // Save file info to database
      const { data: fileData, error: dbError } = await supabaseAdmin
        .from('career_resource_files')
        .insert({
          career_resource_id: careerResourceId,
          file_name: file.name,
          file_type: fileType,
          file_url: urlData.publicUrl,
          file_size: file.size,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded file
        await supabaseAdmin.storage.from(bucketName).remove([uploadData.path]);
        return NextResponse.json({ error: `Failed to save ${file.name} info` }, { status: 500 });
      }

      uploadedFiles.push(fileData);
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error in POST /api/career-resources/files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
