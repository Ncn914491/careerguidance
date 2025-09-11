const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreWeekFiles() {
  console.log('🔍 Restoring week_files from actual storage buckets...\n');

  try {
    // First, clear dummy data we just created
    console.log('1. Clearing dummy files...');
    const { error: clearError } = await supabase
      .from('week_files')
      .delete()
      .or('file_url.like.%picsum%,file_url.like.%dummy.pdf%');
    
    if (clearError) {
      console.error('❌ Error clearing dummy files:', clearError);
    } else {
      console.log('✅ Cleared dummy files');
    }

    // Get all weeks to map files to
    console.log('\n2. Getting weeks data...');
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number');
    
    if (weeksError) {
      console.error('❌ Error fetching weeks:', weeksError);
      return;
    }

    console.log(`📅 Found ${weeks?.length || 0} weeks`);

    // Storage buckets to check
    const buckets = ['week-photos', 'week-videos', 'week-pdfs'];
    
    for (const bucketName of buckets) {
      console.log(`\n3. Checking bucket: ${bucketName}...`);
      
      // First list folders/directories
      const { data: folders, error: foldersError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          offset: 0,
        });

      if (foldersError) {
        console.error(`❌ Error listing folders from ${bucketName}:`, foldersError);
        continue;
      }

      console.log(`📁 Found ${folders?.length || 0} folders in ${bucketName}`);

      // Process each folder
      for (const folder of folders || []) {
        if (!folder.name) continue;
        
        console.log(`\n   📂 Processing folder: ${folder.name}`);
        
        // Extract week number from folder name
        let weekNumber = null;
        
        // Pattern 1: week-1, week-2, etc.
        const weekDashMatch = folder.name.match(/week-(\d+)/i);
        if (weekDashMatch) {
          weekNumber = parseInt(weekDashMatch[1]);
        }
        
        // Pattern 2: week1, week2, etc.
        if (!weekNumber) {
          const weekNoSpace = folder.name.match(/week(\d+)/i);
          if (weekNoSpace) {
            weekNumber = parseInt(weekNoSpace[1]);
          }
        }
        
        // Pattern 3: just number: 1, 2, 3, etc.
        if (!weekNumber) {
          const numberMatch = folder.name.match(/^(\d+)$/);
          if (numberMatch) {
            weekNumber = parseInt(numberMatch[1]);
          }
        }

        if (!weekNumber) {
          console.log(`   ⚠️  Could not determine week number for folder ${folder.name}`);
          continue;
        }

        // Find corresponding week
        const week = weeks.find(w => w.week_number === weekNumber);
        if (!week) {
          console.log(`   ⚠️  No week found for week number ${weekNumber}`);
          continue;
        }

        // List files in this folder
        const { data: files, error: filesError } = await supabase.storage
          .from(bucketName)
          .list(folder.name, {
            limit: 100,
            offset: 0,
          });

        if (filesError) {
          console.error(`   ❌ Error listing files from ${bucketName}/${folder.name}:`, filesError);
          continue;
        }

        console.log(`   📄 Found ${files?.length || 0} files in folder ${folder.name}`);

        // Process each file in the folder
        for (const file of files || []) {
          if (!file.name) continue;
          
          const fullPath = `${folder.name}/${file.name}`;
          console.log(`      Processing file: ${file.name}`);

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fullPath);

          // Determine file type
          let fileType;
          if (bucketName === 'week-photos') {
            fileType = 'photo';
          } else if (bucketName === 'week-videos') {
            fileType = 'video';
          } else if (bucketName === 'week-pdfs') {
            fileType = 'pdf';
          }

          // Check if this file record already exists
          const { data: existingFile } = await supabase
            .from('week_files')
            .select('id')
            .eq('week_id', week.id)
            .eq('file_name', file.name)
            .single();

          if (existingFile) {
            console.log(`      ✅ File record already exists for ${file.name}`);
            continue;
          }

          // Create file record
          const { data: fileRecord, error: insertError } = await supabase
            .from('week_files')
            .insert({
              week_id: week.id,
              file_name: file.name,
              file_type: fileType,
              file_url: publicUrl,
              file_size: file.metadata?.size || null,
              uploaded_by: week.created_by
            })
            .select()
            .single();

          if (insertError) {
            console.error(`      ❌ Error creating file record for ${file.name}:`, insertError);
          } else {
            console.log(`      ✅ Created file record for ${file.name} -> Week ${weekNumber}`);
          }
        }
      }
    }

    // Final verification
    console.log('\n4. Final verification...');
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

    console.log(`\n🎉 Final result (${finalCheck?.length || 0} weeks):`);
    finalCheck?.forEach(week => {
      const photoCount = week.week_files?.filter(f => f.file_type === 'photo').length || 0;
      const videoCount = week.week_files?.filter(f => f.file_type === 'video').length || 0;
      const pdfCount = week.week_files?.filter(f => f.file_type === 'pdf').length || 0;
      
      console.log(`   Week ${week.week_number}: "${week.title}"`);
      console.log(`      📸 ${photoCount} photos | 🎥 ${videoCount} videos | 📄 ${pdfCount} PDFs`);
      
      if (week.week_files?.length > 0) {
        week.week_files.forEach(file => {
          console.log(`         - ${file.file_name} (${file.file_type})`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

restoreWeekFiles();
