const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample image URLs from Unsplash for testing
const sampleImages = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800',
  'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
  'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
  'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800',
  'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800',
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800'
];

const samplePdfs = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://scholar.harvard.edu/files/torman_personal/files/samplepdf.pdf'
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

async function createSampleWeekData() {
  console.log('📚 Creating sample week data with proper file counts...\\n');
  
  await clearExistingData();
  
  // Week data with more realistic content
  const weeks = [
    {
      number: 1,
      title: "Introduction to Career Guidance",
      description: "Overview of career opportunities and guidance principles. Introduction to various career paths and the importance of career planning. Students explored different career options and learned about self-assessment techniques.",
      photoCount: 25, // First week has 25+ images as requested
      pdfCount: 2
    },
    {
      number: 2,
      title: "Self-Assessment and Skills Identification",
      description: "Understanding personal strengths, interests, and skills. Tools and techniques for self-assessment and career exploration. Interactive sessions on identifying individual talents and career preferences.",
      photoCount: 12,
      pdfCount: 1
    },
    {
      number: 3,
      title: "Industry Exploration and Market Trends",
      description: "Exploring different industries and understanding current market trends. Analysis of job market demands and future opportunities. Deep dive into emerging sectors and career prospects.",
      photoCount: 15,
      pdfCount: 2
    },
    {
      number: 4,
      title: "Resume Building and Interview Preparation",
      description: "Creating effective resumes and cover letters. Interview techniques and professional communication skills. Hands-on workshop for crafting compelling career documents and mock interview sessions.",
      photoCount: 18,
      pdfCount: 3
    },
    {
      number: 5,
      title: "Networking and Professional Development",
      description: "Building professional networks and continuous learning. Strategies for career advancement and professional growth. Final presentations and networking session with industry professionals.",
      photoCount: 10,
      pdfCount: 1
    }
  ];
  
  for (const week of weeks) {
    console.log(`📅 Creating Week ${week.number}: ${week.title}`);
    
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
    
    let fileCount = 0;
    
    // Create photo records
    for (let i = 0; i < week.photoCount; i++) {
      const imageUrl = sampleImages[i % sampleImages.length];
      const fileName = `week-${week.number}-photo-${i + 1}.jpg`;
      
      const { error: fileError } = await supabase
        .from('week_files')
        .insert({
          week_id: weekRecord.id,
          file_name: fileName,
          file_type: 'photo',
          file_url: imageUrl,
          file_size: Math.floor(Math.random() * 2000000) + 500000 // Random size between 500KB-2.5MB
        });
        
      if (!fileError) {
        fileCount++;
      } else {
        console.error(`   ❌ Failed to create photo ${fileName}:`, fileError);
      }
    }
    
    // Create PDF records
    for (let i = 0; i < week.pdfCount; i++) {
      const pdfUrl = samplePdfs[i % samplePdfs.length];
      const fileName = `week-${week.number}-document-${i + 1}.pdf`;
      
      const { error: fileError } = await supabase
        .from('week_files')
        .insert({
          week_id: weekRecord.id,
          file_name: fileName,
          file_type: 'pdf',
          file_url: pdfUrl,
          file_size: Math.floor(Math.random() * 5000000) + 1000000 // Random size between 1MB-6MB
        });
        
      if (!fileError) {
        fileCount++;
      } else {
        console.error(`   ❌ Failed to create PDF ${fileName}:`, fileError);
      }
    }
    
    console.log(`📊 Week ${week.number} summary: ${fileCount} files created (${week.photoCount} photos, ${week.pdfCount} PDFs)\\n`);
  }
  
  console.log('🎉 Sample week data creation completed!');
  
  // Verify data
  const { data: verifyWeeks } = await supabase
    .from('weeks')
    .select(`
      *,
      week_files (*)
    `)
    .order('week_number');
    
  if (verifyWeeks) {
    console.log('\\n📊 Verification Summary:');
    verifyWeeks.forEach(week => {
      const files = week.week_files || [];
      const photos = files.filter(f => f.file_type === 'photo');
      const pdfs = files.filter(f => f.file_type === 'pdf');
      console.log(`   Week ${week.week_number}: ${files.length} total files (${photos.length} photos, ${pdfs.length} PDFs)`);
    });
  }
}

createSampleWeekData().catch(console.error);
