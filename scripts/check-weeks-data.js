const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWeeksData() {
  console.log('🔍 Checking weeks data in database...\n');

  try {
    // Fetch all weeks with their files
    const { data: weeks, error } = await supabase
      .from('weeks')
      .select(`
        *,
        week_files (*)
      `)
      .order('week_number', { ascending: true });

    if (error) {
      console.error('❌ Error fetching weeks:', error);
      return;
    }

    if (!weeks || weeks.length === 0) {
      console.log('⚠️ No weeks found in database');
      return;
    }

    console.log(`✅ Found ${weeks.length} weeks in database\n`);

    // Display details for each week
    weeks.forEach((week, index) => {
      console.log(`📅 Week ${week.week_number}: ${week.title}`);
      console.log(`   ID: ${week.id}`);
      console.log(`   Description: ${week.description || 'No description'}`);
      console.log(`   Created: ${new Date(week.created_at).toLocaleDateString()}`);
      
      const files = week.week_files || [];
      const photos = files.filter(f => f.file_type === 'photo');
      const pdfs = files.filter(f => f.file_type === 'pdf');
      const videos = files.filter(f => f.file_type === 'video');
      
      console.log(`   📁 Total Files: ${files.length}`);
      console.log(`      📸 Photos: ${photos.length}`);
      console.log(`      📄 PDFs: ${pdfs.length}`);
      console.log(`      🎥 Videos: ${videos.length}`);
      
      if (files.length > 0) {
        console.log(`   📂 File details:`);
        files.forEach((file, fileIndex) => {
          console.log(`      ${fileIndex + 1}. ${file.file_name} (${file.file_type})`);
          console.log(`         URL: ${file.file_url ? 'Present' : 'Missing'}`);
          console.log(`         Size: ${file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Unknown'}`);
        });
      }
      
      console.log(''); // Empty line for readability
    });

    // Summary
    const totalFiles = weeks.reduce((sum, week) => sum + (week.week_files?.length || 0), 0);
    const totalPhotos = weeks.reduce((sum, week) => sum + (week.week_files?.filter(f => f.file_type === 'photo').length || 0), 0);
    const totalPdfs = weeks.reduce((sum, week) => sum + (week.week_files?.filter(f => f.file_type === 'pdf').length || 0), 0);
    const totalVideos = weeks.reduce((sum, week) => sum + (week.week_files?.filter(f => f.file_type === 'video').length || 0), 0);

    console.log('📊 Summary:');
    console.log(`   Total weeks: ${weeks.length}`);
    console.log(`   Total files: ${totalFiles}`);
    console.log(`   Total photos: ${totalPhotos}`);
    console.log(`   Total PDFs: ${totalPdfs}`);
    console.log(`   Total videos: ${totalVideos}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkWeeksData();
