const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Week titles and descriptions
const weekData = {
  1: {
    title: 'Introduction to Career Guidance',
    description: 'Overview of career opportunities in technology and engineering fields. First week of the program introducing students to various career paths.'
  },
  2: {
    title: 'Computer Science Fundamentals',
    description: 'Basic concepts of programming and software development. Exploring the fundamentals of computer science and its applications.'
  },
  3: {
    title: 'Engineering Disciplines',
    description: 'Exploring different engineering branches and their applications. Understanding various engineering fields and career opportunities.'
  },
  4: {
    title: 'Industry Insights',
    description: 'Guest lectures from industry professionals and career paths. Real-world insights from professionals in the field.'
  },
  5: {
    title: 'Project Showcase',
    description: 'Student presentations and project demonstrations. Showcasing student work and final presentations.'
  }
};

async function uploadFile(filePath, fileName, weekNumber) {
  try {
    console.log(`Uploading ${fileName}...`);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine storage path
    const storagePath = `weeks/week${weekNumber}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('week-files')
      .upload(storagePath, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('week-files')
      .getPublicUrl(storagePath);

    return {
      fileName,
      filePath: storagePath,
      publicUrl: urlData.publicUrl,
      fileSize: fileBuffer.length
    };
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.pdf':
      return 'application/pdf';
    case '.mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    return 'photo';
  } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
    return 'video';
  } else if (ext === '.pdf') {
    return 'pdf';
  }
  return 'photo'; // default
}

async function createWeekRecord(weekNumber, title, description) {
  try {
    console.log(`Creating week ${weekNumber} record...`);
    
    const { data, error } = await supabase
      .from('weeks')
      .insert({
        week_number: weekNumber,
        title,
        description,
        created_by: null // No specific user since we're bypassing auth
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating week ${weekNumber}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error creating week ${weekNumber}:`, error);
    return null;
  }
}

async function createWeekFileRecord(weekId, fileInfo) {
  try {
    const { data, error } = await supabase
      .from('week_files')
      .insert({
        week_id: weekId,
        file_name: fileInfo.fileName,
        file_type: getFileType(fileInfo.fileName),
        file_url: fileInfo.publicUrl,
        file_size: fileInfo.fileSize,
        uploaded_by: null // No specific user since we're bypassing auth
      });

    if (error) {
      console.error(`Error creating file record for ${fileInfo.fileName}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error creating file record for ${fileInfo.fileName}:`, error);
    return false;
  }
}

async function uploadWeekData(weekNumber) {
  console.log(`\n=== Processing Week ${weekNumber} ===`);
  
  const weekFolderPath = path.join(__dirname, '..', 'csp', `week${weekNumber}`);
  
  if (!fs.existsSync(weekFolderPath)) {
    console.log(`Week ${weekNumber} folder not found, skipping...`);
    return;
  }

  // Create week record
  const weekInfo = weekData[weekNumber];
  const weekRecord = await createWeekRecord(weekNumber, weekInfo.title, weekInfo.description);
  
  if (!weekRecord) {
    console.error(`Failed to create week ${weekNumber} record, skipping files...`);
    return;
  }

  console.log(`Week ${weekNumber} record created with ID: ${weekRecord.id}`);

  // Get all files in the week folder
  const files = fs.readdirSync(weekFolderPath);
  console.log(`Found ${files.length} files in week ${weekNumber}`);

  // Upload each file
  for (const fileName of files) {
    const filePath = path.join(weekFolderPath, fileName);
    
    if (fs.statSync(filePath).isFile()) {
      const fileInfo = await uploadFile(filePath, fileName, weekNumber);
      
      if (fileInfo) {
        const success = await createWeekFileRecord(weekRecord.id, fileInfo);
        if (success) {
          console.log(`✓ Successfully uploaded and recorded ${fileName}`);
        } else {
          console.log(`✗ Failed to record ${fileName} in database`);
        }
      } else {
        console.log(`✗ Failed to upload ${fileName}`);
      }
    }
  }
}

async function createStorageBucket() {
  try {
    console.log('Creating storage bucket...');
    
    const { data, error } = await supabase.storage.createBucket('week-files', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });

    if (error && error.message !== 'Bucket already exists') {
      console.error('Error creating bucket:', error);
      return false;
    }

    console.log('Storage bucket ready');
    return true;
  } catch (error) {
    console.error('Error creating storage bucket:', error);
    return false;
  }
}

async function clearExistingData() {
  try {
    console.log('Clearing existing weeks data...');
    
    // Delete existing week files
    const { error: filesError } = await supabase
      .from('week_files')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (filesError) {
      console.error('Error clearing week files:', filesError);
    }

    // Delete existing weeks
    const { error: weeksError } = await supabase
      .from('weeks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (weeksError) {
      console.error('Error clearing weeks:', weeksError);
    }

    console.log('Existing data cleared');
  } catch (error) {
    console.error('Error clearing existing data:', error);
  }
}

async function main() {
  console.log('Starting weeks data upload...');
  
  // Create storage bucket if it doesn't exist
  const bucketReady = await createStorageBucket();
  if (!bucketReady) {
    console.error('Failed to create storage bucket, exiting...');
    return;
  }

  // Clear existing data
  await clearExistingData();

  // Upload data for each week
  for (let weekNumber = 1; weekNumber <= 5; weekNumber++) {
    await uploadWeekData(weekNumber);
  }

  console.log('\n=== Upload Complete ===');
  console.log('All weeks data has been uploaded to Supabase!');
  console.log('You can now view the weeks in your application.');
}

// Run the script
main().catch(console.error);