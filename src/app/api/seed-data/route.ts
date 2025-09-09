import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use admin client for seeding
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

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const results = {
      groups: { created: 0, errors: [] },
      weeks: { created: 0, errors: [] }
    };

    // Create sample groups
    const sampleGroups = [
      { name: 'General Discussion', description: 'General discussion for all students' },
      { name: 'Study Group', description: 'Study together and share resources' },
      { name: 'Career Guidance', description: 'Career advice and guidance' }
    ];

    for (const group of sampleGroups) {
      try {
        const { data: existingGroup } = await supabaseAdmin
          .from('groups')
          .select('id')
          .eq('name', group.name)
          .single();

        if (!existingGroup) {
          const { error } = await supabaseAdmin
            .from('groups')
            .insert(group);

          if (error) {
            results.groups.errors.push(`${group.name}: ${error.message}`);
          } else {
            results.groups.created++;
          }
        }
      } catch (error) {
        results.groups.errors.push(`${group.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create sample weeks
    const sampleWeeks = [
      { 
        week_number: 1, 
        title: 'Introduction to Career Planning', 
        description: 'Overview of career planning and goal setting' 
      },
      { 
        week_number: 2, 
        title: 'Industry Exploration', 
        description: 'Exploring different industries and career paths' 
      },
      { 
        week_number: 3, 
        title: 'Skills Assessment', 
        description: 'Identifying your strengths and areas for improvement' 
      }
    ];

    for (const week of sampleWeeks) {
      try {
        const { data: existingWeek } = await supabaseAdmin
          .from('weeks')
          .select('id')
          .eq('week_number', week.week_number)
          .single();

        if (!existingWeek) {
          const { error } = await supabaseAdmin
            .from('weeks')
            .insert(week);

          if (error) {
            results.weeks.errors.push(`Week ${week.week_number}: ${error.message}`);
          } else {
            results.weeks.created++;
          }
        }
      } catch (error) {
        results.weeks.errors.push(`Week ${week.week_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: 'Seeding completed',
      results
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}