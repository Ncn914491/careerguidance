import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserServer, requireAdminServer } from '@/lib/auth-server';

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
);

export async function GET(request: NextRequest) {
  try {
    // Allow viewing weeks without authentication (public access)
    const { data: weeks, error } = await supabaseAdmin
      .from('weeks')
      .select(`
        *,
        week_files (*)
      `)
      .order('week_number', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 });
    }

    return NextResponse.json({ weeks: weeks || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { user } = await requireAdminServer(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const formData = await request.formData();
    const weekNumber = formData.get('weekNumber') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];

    // Validate required fields
    if (!weekNumber || !title || !description) {
      return NextResponse.json({ 
        error: 'Week number, title, and description are required' 
      }, { status: 400 });
    }

    // Validate week number
    const weekNum = parseInt(weekNumber);
    if (isNaN(weekNum) || weekNum < 1) {
      return NextResponse.json({ 
        error: 'Week number must be a positive number' 
      }, { status: 400 });
    }

    // Check if week number already exists
    const { data: existingWeek } = await supabaseAdmin
      .from('weeks')
      .select('id')
      .eq('week_number', weekNum)
      .single();

    if (existingWeek) {
      return NextResponse.json({ 
        error: 'Week number already exists' 
      }, { status: 400 });
    }

    // Validate file requirements
    const photos = files.filter(file => file.type.startsWith('image/'));
    const pdfs = files.filter(file => file.type === 'application/pdf');
    
    if (photos.length === 0) {
      return NextResponse.json({ 
        error: 'At least one photo is required' 
      }, { status: 400 });
    }
    
    if (pdfs.length === 0) {
      return NextResponse.json({ 
        error: 'At least one PDF file is required' 
      }, { status: 400 });
    }

    // Create week record
    const { data: week, error: weekError } = await supabaseAdmin
      .from('weeks')
      .insert({
        week_number: weekNum,
        title,
        description,
        created_by: user.id
      })
      .select()
      .single();

    if (weekError) {
      console.error('Week creation error:', weekError);
      return NextResponse.json({ 
        error: 'Failed to create week' 
      }, { status: 500 });
    }

    // Upload files and create file records
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `week-${weekNum}/${timestamp}-${file.name}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('week-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          continue; // Skip this file but continue with others
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('week-files')
          .getPublicUrl(fileName);

        // Determine file type
        let fileType: 'photo' | 'video' | 'pdf';
        if (file.type.startsWith('image/')) {
          fileType = 'photo';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type === 'application/pdf') {
          fileType = 'pdf';
        } else {
          continue; // Skip unsupported file types
        }

        // Create file record
        const { data: fileRecord, error: fileError } = await supabaseAdmin
          .from('week_files')
          .insert({
            week_id: week.id,
            file_name: file.name,
            file_type: fileType,
            file_url: publicUrl,
            file_size: file.size,
            uploaded_by: user.id
          })
          .select()
          .single();

        if (!fileError && fileRecord) {
          uploadedFiles.push(fileRecord);
        }
      } catch (error) {
        console.error('File processing error:', error);
        // Continue with other files
      }
    }

    return NextResponse.json({
      message: 'Week created successfully',
      week,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}