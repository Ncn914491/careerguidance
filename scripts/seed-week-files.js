#!/usr/bin/env node

/**
 * Seed sample files for weeks in Career Guidance Project
 * This creates placeholder files and links them to weeks
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

async function createStorageBucket() {
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

async function createSampleFile(fileName, content, mimeType) {
  try {
    // Create a simple text-based file for demonstration
    const buffer = Buffer.from(content, 'utf-8');
    
    const { data, error } = await supabase.storage
      .from('week-files')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('week-files')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`❌ Error creating ${fileName}:`, error.message);
    return null;
  }
}

async function seedWeekFiles() {
  console.log('📁 Seeding sample files for weeks...');
  
  try {
    // Get all weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number');

    if (weeksError) {
      throw weeksError;
    }

    if (!weeks || weeks.length === 0) {
      console.log('❌ No weeks found to add files to');
      return false;
    }

    console.log(`📊 Found ${weeks.length} weeks to add files to`);

    for (const week of weeks) {
      console.log(`\n📅 Processing Week ${week.week_number}: ${week.title}`);
      
      // Create sample files for each week
      const sampleFiles = [
        {
          name: `week-${week.week_number}-presentation.pdf`,
          content: `# Week ${week.week_number}: ${week.title}\n\nThis is a sample PDF file for ${week.title}.\n\n## Content\n${week.description}\n\n## Learning Objectives\n- Understand key concepts\n- Apply practical skills\n- Prepare for next week\n\nThis is a placeholder PDF file created for demonstration purposes.`,
          type: 'pdf',
          mimeType: 'application/pdf'
        },
        {
          name: `week-${week.week_number}-photo-1.jpg`,
          content: `Sample photo data for Week ${week.week_number} - Photo 1\nThis would be actual image data in a real scenario.\nFilename: week-${week.week_number}-photo-1.jpg\nDescription: ${week.title} - Activity Photo`,
          type: 'photo',
          mimeType: 'image/jpeg'
        },
        {
          name: `week-${week.week_number}-photo-2.jpg`,
          content: `Sample photo data for Week ${week.week_number} - Photo 2\nThis would be actual image data in a real scenario.\nFilename: week-${week.week_number}-photo-2.jpg\nDescription: ${week.title} - Group Photo`,
          type: 'photo',
          mimeType: 'image/jpeg'
        }
      ];

      // Add extra files for some weeks
      if (week.week_number === 1) {
        sampleFiles.push({
          name: `week-${week.week_number}-welcome-video.mp4`,
          content: `Sample video data for Week ${week.week_number}\nThis would be actual video data in a real scenario.\nFilename: week-${week.week_number}-welcome-video.mp4\nDescription: Welcome video for ${week.title}`,
          type: 'video',
          mimeType: 'video/mp4'
        });
      }

      if (week.week_number === 4) {
        sampleFiles.push({
          name: `week-${week.week_number}-resume-template.pdf`,
          content: `# Resume Template - Week ${week.week_number}\n\nThis is a sample resume template for ${week.title}.\n\n## Template Structure\n1. Personal Information\n2. Professional Summary\n3. Work Experience\n4. Education\n5. Skills\n6. References\n\nThis template helps students create professional resumes.`,
          type: 'pdf',
          mimeType: 'application/pdf'
        });
      }

      // Upload files and create database records
      for (const file of sampleFiles) {
        const fileUrl = await createSampleFile(file.name, file.content, file.mimeType);
        
        if (fileUrl) {
          // Insert file record into database
          const { error: insertError } = await supabase
            .from('week_files')
            .insert({
              week_id: week.id,
              file_name: file.name,
              file_type: file.type,
              file_url: fileUrl,
              file_size: Buffer.byteLength(file.content, 'utf-8')
            });

          if (insertError) {
            console.error(`❌ Error inserting file record for ${file.name}:`, insertError.message);
          } else {
            console.log(`   ✅ Added ${file.type}: ${file.name}`);
          }
        }
      }
    }

    console.log('\n✅ Sample files seeding completed');
    return true;
  } catch (error) {
    console.error('❌ Error seeding week files:', error.message);
    return false;
  }
}

async function verifyFiles() {
  console.log('\n🔍 Verifying seeded files...');
  
  try {
    const { data: weeks, error } = await supabase
      .from('weeks')
      .select(`
        *,
        week_files (*)
      `)
      .order('week_number');

    if (error) throw error;

    console.log('\n📊 File Summary:');
    weeks.forEach(week => {
      const fileCount = week.week_files.length;
      const fileTypes = week.week_files.reduce((acc, file) => {
        acc[file.file_type] = (acc[file.file_type] || 0) + 1;
        return acc;
      }, {});
      
      const typesSummary = Object.entries(fileTypes)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');
      
      console.log(`   📅 Week ${week.week_number}: ${fileCount} files (${typesSummary || 'none'})`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error verifying files:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Seeding week files for Career Guidance Project\n');
  
  // Step 1: Set up storage bucket
  const bucketReady = await createStorageBucket();
  if (!bucketReady) {
    console.error('❌ Cannot proceed without storage bucket');
    process.exit(1);
  }
  
  // Step 2: Seed sample files
  const filesSeeded = await seedWeekFiles();
  if (!filesSeeded) {
    console.error('❌ Failed to seed files');
    process.exit(1);
  }
  
  // Step 3: Verify results
  await verifyFiles();
  
  console.log('\n🎉 Week files seeding completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit http://localhost:3000/weeks');
  console.log('3. Click on any week to see the files');
  console.log('4. Files should now be visible in the week modals');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});