const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearExistingData() {
  console.log('🗑️ Clearing existing week data...');
  
  try {
    // Get all existing week files and delete them
    const { data: existingFiles } = await supabase
      .from('week_files')
      .select('id');
      
    if (existingFiles && existingFiles.length > 0) {
      const { error: filesError } = await supabase
        .from('week_files')
        .delete()
        .in('id', existingFiles.map(f => f.id));
        
      if (filesError) {
        console.error('Error deleting week files:', filesError);
      } else {
        console.log(`🗑️ Deleted ${existingFiles.length} existing files`);
      }
    }
    
    // Get all existing weeks and delete them
    const { data: existingWeeks } = await supabase
      .from('weeks')
      .select('id');
      
    if (existingWeeks && existingWeeks.length > 0) {
      const { error: weeksError } = await supabase
        .from('weeks')
        .delete()
        .in('id', existingWeeks.map(w => w.id));
        
      if (weeksError) {
        console.error('Error deleting weeks:', weeksError);
      } else {
        console.log(`🗑️ Deleted ${existingWeeks.length} existing weeks`);
      }
    }
    
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

function getFileType(fileName) {
  const ext = fileName.toLowerCase();
  if (ext.includes('.jpg') || ext.includes('.jpeg') || ext.includes('.png') || ext.includes('.gif') || ext.includes('.webp')) {
    return 'photo';
  } else if (ext.includes('.mp4') || ext.includes('.avi') || ext.includes('.mov') || ext.includes('.mkv')) {
    return 'video';
  } else if (ext.includes('.pdf')) {
    return 'pdf';
  }
  return 'unknown';
}

function getWeekNumberFromPath(filePath) {
  // Try to extract week number from file path or name
  const match = filePath.match(/week[\s-_]?(\d+)/i);
  if (match) {
    return parseInt(match[1]);
  }
  
  // If no week pattern found, try to infer from folder structure
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

async function syncStorageData() {
  console.log('📚 Syncing data from Supabase storage buckets...\\n');
  
  await clearExistingData();
  
  // Define buckets and their types
  const buckets = [
    { name: 'week-photos', type: 'photo' },
    { name: 'week-pdfs', type: 'pdf' },
    { name: 'week-videos', type: 'video' }
  ];
  
  // Week data structure
  const weekData = {
    1: {
      title: "Introduction to Career Guidance",
      description: "Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning. Students explored different career options and learned about self-assessment techniques."
    },
    2: {
      title: "Self-Assessment and Skills Identification", 
      description: "Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration. Interactive sessions on identifying individual talents and career preferences."
    },
    3: {
      title: "Industry Exploration and Market Trends",
      description: "Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities. Deep dive into emerging sectors and career prospects."
    },
    4: {
      title: "Resume Building and Interview Preparation",
      description: "Creating effective resumes and cover letters. Interview techniques and professional communication skills. Hands-on workshop for crafting compelling career documents and mock interview sessions."
    },
    5: {
      title: "Networking and Professional Development",
      description: "Building professional networks and continuous learning. Strategies for career advancement and professional growth. Final presentations and networking session with industry professionals."
    }
  };
  
  // Create week records first
  const weekRecords = {};
  for (let i = 1; i <= 5; i++) {
    const { data: weekRecord, error: weekError } = await supabase
      .from('weeks')
      .insert({
        week_number: i,
        title: weekData[i].title,
        description: weekData[i].description
      })
      .select()
      .single();
      
    if (weekError) {
      console.error(`❌ Failed to create week ${i}:`, weekError);
      continue;
    }
    
    weekRecords[i] = weekRecord;
    console.log(`✅ Created Week ${i}: ${weekRecord.title}`);
  }
  
  // Process each bucket
  let totalFilesProcessed = 0;
  
  for (const bucket of buckets) {
    console.log(`\\n📁 Processing bucket: ${bucket.name}`);
    
    try {
      // First list root level to see if we have folders
      const { data: rootItems, error: rootError } = await supabase.storage
        .from(bucket.name)
        .list('', {
          limit: 1000,
          offset: 0
        });
        
      if (rootError) {
        console.error(`❌ Error accessing bucket ${bucket.name}:`, rootError.message);
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
            .from(bucket.name)
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
        console.log(`⚠️ No files found in bucket ${bucket.name}`);
        continue;
      }
      
      console.log(`📂 Found ${files.length} actual files in ${bucket.name}`);
      
      // Process each file
      for (const file of files) {
        
        const weekNumber = getWeekNumberFromPath(file.name);
        if (!weekNumber || !weekRecords[weekNumber]) {
          console.log(`⚠️ Could not determine week for file: ${file.name} (inferred week: ${weekNumber})`);
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket.name)
          .getPublicUrl(file.name);
        
        // Create file record
        const { error: fileError } = await supabase
          .from('week_files')
          .insert({
            week_id: weekRecords[weekNumber].id,
            file_name: file.name,
            file_type: bucket.type,
            file_url: publicUrl,
            file_size: file.metadata?.size || null
          });
          
        if (fileError) {
          console.error(`   ❌ Failed to create record for ${file.name}:`, fileError);
        } else {
          totalFilesProcessed++;
          console.log(`   ✅ Added ${file.name} to Week ${weekNumber}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing bucket ${bucket.name}:`, error);
    }
  }
  
  console.log(`\\n🎉 Sync completed! Processed ${totalFilesProcessed} files`);
  
  // Verify the results
  console.log('\\n📊 Final verification:');
  const { data: verifyWeeks } = await supabase
    .from('weeks')
    .select(`
      *,
      week_files (*)
    `)
    .order('week_number');
    
  if (verifyWeeks) {
    verifyWeeks.forEach(week => {
      const files = week.week_files || [];
      const photos = files.filter(f => f.file_type === 'photo');
      const pdfs = files.filter(f => f.file_type === 'pdf');
      const videos = files.filter(f => f.file_type === 'video');
      console.log(`   Week ${week.week_number}: ${files.length} files (📸 ${photos.length} photos, 📄 ${pdfs.length} PDFs, 🎥 ${videos.length} videos)`);
    });
  }
}

syncStorageData().catch(console.error);
