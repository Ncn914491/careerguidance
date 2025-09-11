const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugWeeksFiles() {
  console.log('🔍 Debugging weeks and week_files...\n');

  try {
    // 1. Check weeks table structure
    console.log('1. Checking weeks data...');
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number');
    
    if (weeksError) {
      console.error('❌ Error fetching weeks:', weeksError);
      return;
    }

    console.log(`📅 Found ${weeks?.length || 0} weeks:`);
    weeks?.forEach(week => {
      console.log(`   Week ${week.week_number}: "${week.title}"`);
    });
    console.log('');

    // 2. Check week_files table structure
    console.log('2. Checking week_files data...');
    const { data: weekFiles, error: filesError } = await supabase
      .from('week_files')
      .select('*')
      .order('created_at');
    
    if (filesError) {
      console.error('❌ Error fetching week_files:', filesError);
      return;
    }

    console.log(`📁 Found ${weekFiles?.length || 0} week files:`);
    weekFiles?.forEach(file => {
      console.log(`   File: "${file.file_name}" (${file.file_type}) -> Week ID: ${file.week_id}`);
    });
    console.log('');

    // 3. Test JOIN query (same as API)
    console.log('3. Testing JOIN query (same as API)...');
    const { data: weeksWithFiles, error: joinError } = await supabase
      .from('weeks')
      .select(`
        *,
        week_files (*)
      `)
      .order('week_number', { ascending: true });

    if (joinError) {
      console.error('❌ Error with JOIN query:', joinError);
      return;
    }

    console.log(`📊 JOIN query result (${weeksWithFiles?.length || 0} weeks):`);
    weeksWithFiles?.forEach(week => {
      console.log(`   Week ${week.week_number}: "${week.title}" has ${week.week_files?.length || 0} files`);
      if (week.week_files?.length > 0) {
        week.week_files.forEach(file => {
          console.log(`      - ${file.file_name} (${file.file_type})`);
        });
      }
    });
    console.log('');

    // 4. If no files exist, create sample files for existing weeks
    if ((!weekFiles || weekFiles.length === 0) && weeks && weeks.length > 0) {
      console.log('4. No files found! Creating sample files for existing weeks...\n');
      
      for (const week of weeks) {
        console.log(`📸 Adding sample files for Week ${week.week_number}...`);
        
        // Sample photo files
        const sampleFiles = [
          {
            week_id: week.id,
            file_name: `week-${week.week_number}-photo-1.jpg`,
            file_type: 'photo',
            file_url: `https://picsum.photos/800/600?random=${week.week_number}1`,
            file_size: 150000,
            uploaded_by: week.created_by
          },
          {
            week_id: week.id,
            file_name: `week-${week.week_number}-photo-2.jpg`,
            file_type: 'photo',
            file_url: `https://picsum.photos/800/600?random=${week.week_number}2`,
            file_size: 200000,
            uploaded_by: week.created_by
          },
          {
            week_id: week.id,
            file_name: `week-${week.week_number}-notes.pdf`,
            file_type: 'pdf',
            file_url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
            file_size: 50000,
            uploaded_by: week.created_by
          }
        ];

        const { data: insertedFiles, error: insertError } = await supabase
          .from('week_files')
          .insert(sampleFiles)
          .select();

        if (insertError) {
          console.error(`❌ Error inserting files for week ${week.week_number}:`, insertError);
        } else {
          console.log(`✅ Added ${insertedFiles?.length || 0} files for week ${week.week_number}`);
        }
      }
    }

    // 5. Final verification
    console.log('\n5. Final verification...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('weeks')
      .select(`
        *,
        week_files (*)
      `)
      .order('week_number', { ascending: true });

    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }

    console.log(`🎉 Final result (${finalCheck?.length || 0} weeks):`);
    finalCheck?.forEach(week => {
      console.log(`   Week ${week.week_number}: "${week.title}" has ${week.week_files?.length || 0} files`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugWeeksFiles();
