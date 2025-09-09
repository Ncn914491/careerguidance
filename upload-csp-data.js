const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_') || supabaseKey.includes('YOUR_')) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Week data with proper titles and descriptions
const weeksData = {
  1: {
    title: "Introduction to Career Guidance",
    description: "Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning. Students explored different career options and learned about self-assessment techniques.",
  },
  2: {
    title: "Self-Assessment and Skills Identification", 
    description: "Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration. Interactive sessions on identifying individual talents and career preferences.",
  },
  3: {
    title: "Industry Exploration and Market Trends",
    description: "Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities. Deep dive into emerging sectors and career prospects.",
  },
  4: {
    title: "Resume Building and Interview Preparation",
    description: "Creating effective resumes and cover letters. Interview techniques and professional communication skills. Hands-on workshop for crafting compelling career documents and mock interview sessions.",
  },
  5: {
    title: "Networking and Professional Development",
    description: "Building professional networks and continuous learning. Strategies for career advancement and professional growth. Final presentations and networking session with industry professionals.",
  }
};

async function ensureBucketExists(bucketName) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        return false;
      }
      console.log(`✅ Bucket ${bucketName} created successfully`);
    } else {
      console.log(`✅ Bucket ${bucketName} already exists`);
    }
    return true;
  } catch (error) {
    console.error(`Error checking/creating bucket ${bucketName}:`, error);
    return false;
  }
}

async function uploadFile(filePath, bucketName, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    
    // Determine proper content type
    let contentType = 'application/octet-stream';
    if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.avi') contentType = 'video/avi';
    else if (ext === '.mov') contentType = 'video/mov';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType
      });

    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log(`✅ Uploaded: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    return null;
  }
}

async function processWeekFolder(weekNumber) {
  const weekFolderPath = path.join('csp', `week${weekNumber}`);
  
  if (!fs.existsSync(weekFolderPath)) {
    console.error(`❌ Week ${weekNumber} folder not found: ${weekFolderPath}`);
    return null;
  }

  console.log(`\n📁 Processing Week ${weekNumber}...`);
  
  const files = fs.readdirSync(weekFolderPath);
  const photos = [];
  let pdfUrl = null;

  // Ensure buckets exist
  await ensureBucketExists('week-photos');
  await ensureBucketExists('week-pdfs');
  await ensureBucketExists('week-videos');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(weekFolderPath, file);
    const ext = path.extname(file).toLowerCase();
    
    console.log(`Processing ${i + 1}/${files.length}: ${file}`);
    
    try {
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        // Upload photo
        const fileName = `week${weekNumber}/${file}`;
        const url = await uploadFile(filePath, 'week-photos', fileName);
        if (url) photos.push(url);
        
      } else if (ext === '.pdf') {
        // Upload PDF
        const fileName = `week${weekNumber}/${file}`;
        pdfUrl = await uploadFile(filePath, 'week-pdfs', fileName);
        
      } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
        // Upload video (treat as additional media)
        const fileName = `week${weekNumber}/${file}`;
        const url = await uploadFile(filePath, 'week-videos', fileName);
        if (url) photos.push(url); // Add video URLs to photos array for now
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file}:`, error.message);
    }
    
    // Small delay between files to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`📊 Week ${weekNumber} processed: ${photos.length} media files, ${pdfUrl ? '1' : '0'} PDF`);
  
  return {
    weekNumber,
    photos,
    pdfUrl,
    title: weeksData[weekNumber].title,
    description: weeksData[weekNumber].description
  };
}

async function insertWeekRecord(weekData) {
  try {
    const { data, error } = await supabase
      .from('weeks')
      .insert({
        week_number: weekData.weekNumber,
        title: weekData.title,
        description: weekData.description,
        pdf_url: weekData.pdfUrl,
        photos: weekData.photos,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error inserting Week ${weekData.weekNumber}:`, error);
      return false;
    }

    console.log(`✅ Week ${weekData.weekNumber} inserted into database`);
    console.log(`   - Title: ${weekData.title}`);
    console.log(`   - Photos: ${weekData.photos.length}`);
    console.log(`   - PDF: ${weekData.pdfUrl ? 'Yes' : 'No'}`);
    return true;
  } catch (error) {
    console.error(`❌ Error inserting Week ${weekData.weekNumber}:`, error);
    return false;
  }
}

async function verifyData() {
  try {
    console.log('\n🔍 Verifying uploaded data...');
    
    const { data: weeks, error } = await supabase
      .from('weeks')
      .select('week_number, title, pdf_url, photos')
      .order('week_number');

    if (error) {
      console.error('❌ Error verifying data:', error);
      return false;
    }

    console.log('📋 Database verification results:');
    weeks.forEach(week => {
      console.log(`Week ${week.week_number}: ${week.title}`);
      console.log(`  - Photos: ${week.photos ? week.photos.length : 0}`);
      console.log(`  - PDF: ${week.pdf_url ? 'Yes' : 'No'}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting CSP data upload process...');
  
  try {
    // Process each week folder
    for (let weekNumber = 1; weekNumber <= 5; weekNumber++) {
      const weekData = await processWeekFolder(weekNumber);
      if (weekData) {
        await insertWeekRecord(weekData);
      } else {
        console.error(`❌ Failed to process Week ${weekNumber}`);
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify all data
    await verifyData();
    
    console.log('\n🎉 CSP data upload completed successfully!');
    console.log('All photos, PDFs, and week records have been uploaded and inserted into the database.');
    
  } catch (error) {
    console.error('❌ Fatal error during upload process:', error);
    process.exit(1);
  }
}

// Run the script
main();
