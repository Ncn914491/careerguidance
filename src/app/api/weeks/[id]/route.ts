import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch specific week with its files
    const { data: week, error: weekError } = await supabase
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
      .eq('id', id)
      .single();

    if (weekError) {
      console.error('Error fetching week:', weekError);
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ week });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}