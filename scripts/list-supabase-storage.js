const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getWeekNumberFromPath(filePath) {
  // Try to extract week number from file path or name
  const match = filePath.match(/week[\s-_]?(\d+)/i);
  if (match) {
    return parseInt(match[1]);
  }
  
  // If no week pattern found, try to infer from folder structure or number patterns
  const pathParts = filePath.split('/');
  for (const part of pathParts) {
    const weekMatch = part.match(/(\d+)/);
    if (weekMatch) {
      const num = parseInt(weekMatch[1]);
      if (num >= 1 && num <= 10) { // Reasonable week number
        return num;
      }
    }
  }
  
  return null;
}

async function listStorageBuckets() {
  console.log('📁 Analyzing Supabase storage buckets...\n');
  
  // Define buckets to check
  const buckets = ['week-photos', 'week-pdfs', 'week-videos'];
  
  const summary = {
    totalFiles: 0,
    filesByWeek: {},
    filesByType: { photos: 0, pdfs: 0, videos: 0 }
  };
  
  for (const bucketName of buckets) {
    console.log(`🗂️ Checking bucket: ${bucketName}`);
    console.log('=' + '='.repeat(bucketName.length + 20));
    
    try {
      // First list root level to see if we have folders
      const { data: rootItems, error: rootError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 1000,
          offset: 0
        });
        
      if (rootError) {
        console.error(`❌ Error accessing bucket ${bucketName}:`, rootError.message);
        continue;
      }
      
      let files = [];
      
      // Check if we have folders (week1, week2, etc.) or direct files
      const folders = rootItems?.filter(item => !item.name.includes('.') && item.name.match(/week\d+/i)) || [];
      
      if (folders.length > 0) {
        console.log(`📁 Found ${folders.length} week folders: ${folders.map(f => f.name).join(', ')}`);
        
        // List files in each folder
        for (const folder of folders) {
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from(bucketName)
            .list(folder.name, {
              limit: 1000,
              offset: 0
            });
            
          if (folderError) {
            console.error(`❌ Error listing files in ${folder.name}:`, folderError.message);
            continue;
          }
          
          if (folderFiles) {
            // Add folder path to file names for proper organization
            const folderFilesWithPath = folderFiles
              .filter(file => file.name !== '.emptyFolderPlaceholder')
              .map(file => ({
                ...file,
                name: `${folder.name}/${file.name}`,
                originalName: file.name,
                folder: folder.name
              }));
            files = files.concat(folderFilesWithPath);
          }
        }
      } else {
        // Direct files in root
        files = rootItems?.filter(file => file.name !== '.emptyFolderPlaceholder') || [];
        }
        
      if (!files || files.length === 0) {
        console.log(`⚠️ No files found in bucket ${bucketName}\n`);
        continue;
      }
      
      console.log(`📂 Found ${files.length} actual files in ${bucketName}:`);
      
      // Group files by week
      const filesByWeek = {};
      
      files.forEach((file, index) => {
        const weekNumber = getWeekNumberFromPath(file.name);
        const sizeKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : 'Unknown';
        
        if (!filesByWeek[weekNumber]) {
          filesByWeek[weekNumber] = [];
        }
        filesByWeek[weekNumber].push(file);
        
        console.log(`   ${index + 1}. ${file.originalName || file.name}`);
        console.log(`      Path: ${file.name}`);
        console.log(`      Week: ${weekNumber || 'Unknown'} | Size: ${sizeKB} KB`);
        console.log(`      Created: ${file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown'}`);
        
        // Get public URL for verification
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(file.name);
        console.log(`      URL: ${publicUrl.substring(0, 80)}...`);
        console.log('');
      });
      
      // Week summary for this bucket
      console.log('📊 Week distribution:');
      Object.keys(filesByWeek).sort((a, b) => {
        if (a === 'null') return 1;
        if (b === 'null') return -1;
        return parseInt(a) - parseInt(b);
      }).forEach(week => {
        const count = filesByWeek[week].length;
        console.log(`   Week ${week === 'null' ? 'Unknown' : week}: ${count} files`);
        
        // Update global summary
        if (week !== 'null') {
          if (!summary.filesByWeek[week]) {
            summary.filesByWeek[week] = { photos: 0, pdfs: 0, videos: 0 };
          }
          
          if (bucketName === 'week-photos') {
            summary.filesByWeek[week].photos += count;
            summary.filesByType.photos += count;
          } else if (bucketName === 'week-pdfs') {
            summary.filesByWeek[week].pdfs += count;
            summary.filesByType.pdfs += count;
          } else if (bucketName === 'week-videos') {
            summary.filesByWeek[week].videos += count;
            summary.filesByType.videos += count;
          }
        }
      });
      
      summary.totalFiles += files.length;
      console.log('');
      
    } catch (error) {
      console.error(`❌ Unexpected error with bucket ${bucketName}:`, error);
      console.log('');
    }
  }
  
  // Overall summary
  console.log('🎯 OVERALL SUMMARY');
  console.log('==================');
  console.log(`📁 Total files across all buckets: ${summary.totalFiles}`);
  console.log(`📸 Photos: ${summary.filesByType.photos}`);
  console.log(`📄 PDFs: ${summary.filesByType.pdfs}`);
  console.log(`🎥 Videos: ${summary.filesByType.videos}`);
  console.log('');
  
  console.log('📅 Files by week:');
  Object.keys(summary.filesByWeek).sort((a, b) => parseInt(a) - parseInt(b)).forEach(week => {
    const weekData = summary.filesByWeek[week];
    const total = weekData.photos + weekData.pdfs + weekData.videos;
    console.log(`   Week ${week}: ${total} files (📸 ${weekData.photos} photos, 📄 ${weekData.pdfs} PDFs, 🎥 ${weekData.videos} videos)`);
  });
  
  console.log('\n✅ Analysis complete!');
  
  if (summary.totalFiles > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Review the file distribution above');
    console.log('   2. Run sync-supabase-storage-data.js to sync this data to your database');
    console.log('   3. Verify the data appears correctly in your frontend');
  }
}

listStorageBuckets().catch(console.error);
