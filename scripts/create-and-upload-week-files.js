#!/usr/bin/env node

/**
 * Create sample week files and upload to Supabase storage
 * This script creates the CSP folder structure and uploads all files
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample file content (base64 encoded 1x1 pixel images and simple PDF content)
const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGbK7bfgAAAABJRU5ErkJggg==';
const samplePDFBase64 = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPJ4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMDkgMDAwMDAgbgowMDAwMDAwMDU4IDAwMDAwIG4KMDAwMDAwMDExNSAwMDAwMCBuCnRyYWlsZXIKPDwKL1NpemUgNAovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMTc0CiUlRU9G';

const weekData = [
  {
    number: 1,
    title: 'Introduction to Career Guidance',
    description: 'Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning.',
    photos: ['intro_session.jpg', 'group_discussion.jpg', 'presentation_slides.jpg', 'student_interaction.jpg'],
    pdf: 'Week1_Career_Introduction.pdf'
  },
  {
    number: 2,
    title: 'Self-Assessment and Skills Identification',
    description: 'Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration.',
    photos: ['skills_assessment.jpg', 'personality_test.jpg', 'strengths_workshop.jpg', 'individual_counseling.jpg', 'group_activity.jpg'],
    pdf: 'Week2_Skills_Assessment.pdf'
  },
  {
    number: 3,
    title: 'Industry Exploration and Market Trends',
    description: 'Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities.',
    photos: ['industry_presentation.jpg', 'market_analysis.jpg', 'guest_speaker.jpg', 'research_session.jpg', 'trend_discussion.jpg', 'data_visualization.jpg'],
    pdf: 'Week3_Industry_Trends.pdf'
  },
  {
    number: 4,
    title: 'Resume Building and Interview Preparation',
    description: 'Creating effective resumes and cover letters. Interview techniques and professional communication skills.',
    photos: ['resume_workshop.jpg', 'interview_practice.jpg', 'mock_interview.jpg', 'cv_review.jpg', 'communication_skills.jpg', 'professional_attire.jpg', 'feedback_session.jpg'],
    pdf: 'Week4_Resume_Interview.pdf'
  },
  {
    number: 5,
    title: 'Networking and Professional Development',
    description: 'Building professional networks and continuous learning. Strategies for career advancement and professional growth.',
    photos: ['networking_event.jpg', 'linkedin_workshop.jpg', 'professional_meetup.jpg', 'mentorship_session.jpg', 'career_fair.jpg', 'alumni_interaction.jpg', 'success_stories.jpg', 'graduation_ceremony.jpg'],
    pdf: 'Week5_Networking_Development.pdf'
  }
];

async function createCSPFolder() {
  console.log('📁 Creating CSP folder structure...');
  
  const cspPath = path.join(process.cwd(), 'csp');
  
  // Create main CSP directory
  if (!fs.existsSync(cspPath)) {
    fs.mkdirSync(cspPath);
  }
  
  // Create week folders and files
  for (const week of weekData) {
    const weekPath = path.join(cspPath, `Week${week.number}`);
    
    if (!fs.existsSync(weekPath)) {
      fs.mkdirSync(weekPath);
    }
    
    // Create photo files
    for (const photo of week.photos) {
      const photoPath = path.join(weekPath, photo);
      const imageBuffer = Buffer.from(sampleImageBase64, 'base64');
      fs.writeFileSync(photoPath, imageBuffer);
    }
    
    // Create PDF file
    const pdfPath = path.join(weekPath, week.pdf);
    const pdfBuffer = Buffer.from(samplePDFBase64, 'base64');
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log(`✅ Created Week${week.number} with ${week.photos.length} photos and 1 PDF`);
  }
  
  console.log(`✅ CSP folder created with ${weekData.length} weeks`);
}

async function setupStorageBucket() {
  console.log('🗂️  Setting up storage bucket...');
  
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'week-files');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('week-files', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });
      
      if (error) {
        console.error('❌ Error creating storage bucket:', error.message);
        return false;
      } else {
        console.log('✅ Storage bucket created');
      }
    } else {
      console.log('✅ Storage bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up storage:', error.message);
    return false;
  }
}

async function uploadWeekFiles() {
  console.log('📤 Uploading week files to Supabase storage...');
  
  const cspPath = path.join(process.cwd(), 'csp');
  let totalUploaded = 0;
  
  for (const week of weekData) {
    console.log(`\n📁 Processing Week ${week.number}...`);
    
    const weekPath = path.join(cspPath, `Week${week.number}`);
    
    // Get week record from database
    const { data: weekRecord, error: weekError } = await supabase
      .from('weeks')
      .select('id')
      .eq('week_number', week.number)
      .single();
    
    if (weekError || !weekRecord) {
      console.error(`❌ Week ${week.number} not found in database`);
      continue;
    }
    
    // Upload photos
    for (const photo of week.photos) {
      const photoPath = path.join(weekPath, photo);
      const fileBuffer = fs.readFileSync(photoPath);
      
      const fileName = `week-${week.number}/${Date.now()}-${photo}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('week-files')
        .upload(fileName, fileBuffer, {
          contentType: 'image/jpeg'
        });
      
      if (uploadError) {
        console.error(`❌ Error uploading ${photo}:`, uploadError.message);
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('week-files')
        .getPublicUrl(fileName);
      
      // Save file record to database
      const { error: fileError } = await supabase
        .from('week_files')
        .insert({
          week_id: weekRecord.id,
          file_name: photo,
          file_type: 'photo',
          file_url: publicUrl,
          file_size: fileBuffer.length
        });
      
      if (fileError) {
        console.error(`❌ Error saving ${photo} record:`, fileError.message);
      } else {
        console.log(`   ✅ Uploaded ${photo}`);
        totalUploaded++;
      }
    }
    
    // Upload PDF
    const pdfPath = path.join(weekPath, week.pdf);
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    const pdfFileName = `week-${week.number}/${Date.now()}-${week.pdf}`;
    
    const { data: pdfUploadData, error: pdfUploadError } = await supabase.storage
      .from('week-files')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf'
      });
    
    if (pdfUploadError) {
      console.error(`❌ Error uploading ${week.pdf}:`, pdfUploadError.message);
    } else {
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('week-files')
        .getPublicUrl(pdfFileName);
      
      // Save file record to database
      const { error: pdfFileError } = await supabase
        .from('week_files')
        .insert({
          week_id: weekRecord.id,
          file_name: week.pdf,
          file_type: 'pdf',
          file_url: publicUrl,
          file_size: pdfBuffer.length
        });
      
      if (pdfFileError) {
        console.error(`❌ Error saving ${week.pdf} record:`, pdfFileError.message);
      } else {
        console.log(`   ✅ Uploaded ${week.pdf}`);
        totalUploaded++;
      }
    }
  }
  
  console.log(`\n✅ Upload complete! ${totalUploaded} files uploaded successfully`);
}

async function verifyUploads() {
  console.log('\n🔍 Verifying uploads...');
  
  const { data: weeks, error } = await supabase
    .from('weeks')
    .select(`
      *,
      week_files (*)
    `)
    .order('week_number');
  
  if (error) {
    console.error('❌ Error verifying uploads:', error.message);
    return;
  }
  
  console.log('\n📊 Upload Summary:');
  weeks.forEach(week => {
    const photos = week.week_files.filter(f => f.file_type === 'photo').length;
    const pdfs = week.week_files.filter(f => f.file_type === 'pdf').length;
    console.log(`   Week ${week.week_number}: ${photos} photos, ${pdfs} PDFs`);
  });
  
  const totalFiles = weeks.reduce((sum, week) => sum + week.week_files.length, 0);
  console.log(`\n✅ Total files in database: ${totalFiles}`);
}

async function main() {
  console.log('🚀 Creating and uploading week files to Supabase\n');
  
  try {
    // Step 1: Create CSP folder structure
    await createCSPFolder();
    
    // Step 2: Setup storage bucket
    const bucketReady = await setupStorageBucket();
    if (!bucketReady) {
      console.error('❌ Failed to setup storage bucket');
      process.exit(1);
    }
    
    // Step 3: Upload all files
    await uploadWeekFiles();
    
    // Step 4: Verify uploads
    await verifyUploads();
    
    console.log('\n🎉 All week files created and uploaded successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000/weeks to see all photos and PDFs');
    console.log('3. Each week should now have multiple photos and a PDF file');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();