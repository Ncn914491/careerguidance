import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch weeks with their associated files
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select(`
        *,
        week_files (
          id,
          file_name,
          file_type,
          file_url,
          file_size,
          created_at
        )
      `)
      .order('week_number', { ascending: true });

    if (weeksError) {
      console.error('Error fetching weeks:', weeksError);
      return NextResponse.json(
        { error: 'Failed to fetch weeks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ weeks: weeks || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const weekNumber = formData.get('weekNumber') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    // Get all files
    const files = formData.getAll('files') as File[];
    
    // Validate required fields
    if (!weekNumber || !title || !description) {
      return NextResponse.json(
        { error: 'Week number, title, and description are required' },
        { status: 400 }
      );
    }

    // Validate files - need at least 1 photo and 1 PDF
    const photos = files.filter(file => file.type.startsWith('image/'));
    const pdfs = files.filter(file => file.type === 'application/pdf');
    
    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo is required' },
        { status: 400 }
      );
    }
    
    if (pdfs.length === 0) {
      return NextResponse.json(
        { error: 'At least one PDF file is required' },
        { status: 400 }
      );
    }

    // Check if week number already exists
    const { data: existingWeek } = await supabase
      .from('weeks')
      .select('id')
      .eq('week_number', parseInt(weekNumber))
      .single();

    if (existingWeek) {
      return NextResponse.json(
        { error: 'Week number already exists' },
        { status: 400 }
      );
    }

    // Create the week record
    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .insert({
        week_number: parseInt(weekNumber),
        title,
        description,
        created_by: 'admin' // TODO: Replace with actual user ID when auth is implemented
      })
      .select()
      .single();

    if (weekError) {
      console.error('Error creating week:', weekError);
      return NextResponse.json(
        { error: 'Failed to create week' },
        { status: 500 }
      );
    }

    // Upload files to Supabase storage and create file records
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileName = `week-${weekNumber}/${Date.now()}-${file.name}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('week-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue; // Skip this file but continue with others
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
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

      // Create file record in database
      const { data: fileRecord, error: fileError } = await supabase
        .from('week_files')
        .insert({
          week_id: week.id,
          file_name: file.name,
          file_type: fileType,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: 'admin' // TODO: Replace with actual user ID when auth is implemented
        })
        .select()
        .single();

      if (!fileError) {
        uploadedFiles.push(fileRecord);
      }
    }

    return NextResponse.json({
      message: 'Week created successfully',
      week,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}