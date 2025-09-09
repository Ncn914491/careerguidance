const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Week data with descriptions
const weekData = [
  {
    number: 1,
    title: "Introduction to Career Guidance",
    description: "Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning. Students explored different career options and learned about self-assessment techniques.",
    folder: "week1"
  },
  {
    number: 2, 
    title: "Self-Assessment and Skills Identification",
    description: "Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration. Interactive sessions on identifying individual talents and career preferences.",
    folder: "week2"
  },
  {
    number: 3,
    title: "Industry Exploration and Market Trends", 
    description: "Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities. Deep dive into emerging sectors and career prospects.",
    folder: "week3"
  },
  {
    number: 4,
    title: "Resume Building and Interview Preparation",
    description: "Creating effective resumes and cover letters. Interview techniques and professional communication skills. Hands-on workshop for crafting compelling career documents and mock interview sessions.", 
    folder: "week4"
  },
  {
    number: 5,
    title: "Networking and Professional Development",
    description: "Building professional networks and continuous learning. Strategies for career advancement and professional growth. Final presentations and networking session with industry professionals.",
    folder: "week5"
  }
];

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
  const ext = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return 'photo';
  } else if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) {
    return 'video';
  } else if (ext === '.pdf') {
    return 'pdf';
  }
  return null;
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function uploadFile(filePath, fileName, weekNumber) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const mimeType = getMimeType(fileName);
    const storageFileName = `week-${weekNumber}/${Date.now()}-${fileName}`;
    
    // Upload to Supabase storage with proper content type
    const { data, error } = await supabase.storage
      .from('week-files')
      .upload(storageFileName, fileContent, {
        contentType: mimeType,
        upsert: false
      });
      
    if (error) {
      console.error(`❌ Upload failed for ${fileName}:`, error);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('week-files')
      .getPublicUrl(storageFileName);
      
    return publicUrl;
  } catch (error) {
    console.error(`❌ File processing error for ${fileName}:`, error);
    return null;
  }
}

async function uploadWeekData() {
  console.log('📚 Starting CSP data upload...\n');
  
  // Check if CSP folder exists
  const cspFolder = path.join(__dirname, '..', 'csp');
  if (!fs.existsSync(cspFolder)) {
    console.log('❌ CSP folder not found at:', cspFolder);
    console.log('Please make sure the CSP data folder exists in the project root.');
    return;
  }
  
  await clearExistingData();
  
  for (const week of weekData) {
    console.log(`📅 Processing Week ${week.number}: ${week.title}`);
    
    // Create week record
    const { data: weekRecord, error: weekError } = await supabase
      .from('weeks')
      .insert({
        week_number: week.number,
        title: week.title,
        description: week.description
      })
      .select()
      .single();
      
    if (weekError) {
      console.error(`❌ Failed to create week ${week.number}:`, weekError);
      continue;
    }
    
    console.log(`✅ Created week record: ${weekRecord.id}`);
    
    // Process files in week folder
    const weekFolder = path.join(cspFolder, week.folder);
    if (!fs.existsSync(weekFolder)) {
      console.log(`⚠️ Week ${week.number} folder not found:`, weekFolder);
      continue;
    }
    
    const files = fs.readdirSync(weekFolder);
    console.log(`📁 Found ${files.length} files in ${week.folder}`);
    
    let uploadedCount = 0;
    
    for (const fileName of files) {
      const filePath = path.join(weekFolder, fileName);
      const stats = fs.statSync(filePath);
      
      if (!stats.isFile()) continue;
      
      const fileType = getFileType(fileName);
      if (!fileType) {
        console.log(`⚠️ Skipping unsupported file: ${fileName}`);
        continue;
      }
      
      console.log(`   📤 Uploading ${fileName} (${fileType})...`);
      
      // Upload file to storage
      const fileUrl = await uploadFile(filePath, fileName, week.number);
      if (!fileUrl) continue;
      
      // Create file record in database
      const { data: fileRecord, error: fileError } = await supabase
        .from('week_files')
        .insert({
          week_id: weekRecord.id,
          file_name: fileName,
          file_type: fileType,
          file_url: fileUrl,
          file_size: stats.size
        })
        .select()
        .single();
        
      if (fileError) {
        console.error(`   ❌ Failed to save file record for ${fileName}:`, fileError);
      } else {
        uploadedCount++;
        console.log(`   ✅ Uploaded ${fileName}`);
      }
    }
    
    console.log(`📊 Week ${week.number} summary: ${uploadedCount} files uploaded\n`);
  }
  
  console.log('🎉 CSP data upload completed!');
}

uploadWeekData().catch(console.error);
