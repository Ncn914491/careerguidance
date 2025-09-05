import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('Error fetching schools:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schools' },
        { status: 500 }
      );
    }

    return NextResponse.json(schools || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}