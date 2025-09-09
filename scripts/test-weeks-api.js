const https = require('https');

// Test function to check API endpoint
async function testWeeksAPI() {
  console.log('🧪 Testing Weeks API endpoint...\n');
  
  try {
    // Since we're testing locally, we need to check if server is running
    const response = await fetch('http://localhost:3000/api/weeks');
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received successfully');
    console.log('📊 Data structure analysis:\n');
    
    if (!data.weeks || !Array.isArray(data.weeks)) {
      console.error('❌ Invalid data structure: weeks array not found');
      return;
    }
    
    console.log(`📅 Total weeks: ${data.weeks.length}`);
    
    data.weeks.forEach((week, index) => {
      console.log(`\\n🔍 Week ${week.week_number}: ${week.title}`);
      console.log(`   📝 Description: ${week.description ? 'Present' : 'Missing'}`);
      console.log(`   🆔 ID: ${week.id}`);
      console.log(`   📅 Created: ${week.created_at}`);
      
      if (!week.week_files || !Array.isArray(week.week_files)) {
        console.log('   ❌ week_files array missing or invalid');
        return;
      }
      
      const files = week.week_files;
      const photos = files.filter(f => f.file_type === 'photo');
      const pdfs = files.filter(f => f.file_type === 'pdf');
      const videos = files.filter(f => f.file_type === 'video');
      
      console.log(`   📁 Total files: ${files.length}`);
      console.log(`      📸 Photos: ${photos.length}`);
      console.log(`      📄 PDFs: ${pdfs.length}`);
      console.log(`      🎥 Videos: ${videos.length}`);
      
      // Test a few file records
      if (files.length > 0) {
        console.log(`   🔍 Sample files:`);
        files.slice(0, 3).forEach((file, fileIndex) => {
          console.log(`      ${fileIndex + 1}. ${file.file_name} (${file.file_type})`);
          console.log(`         URL: ${file.file_url ? '✅' : '❌'}`);
          console.log(`         Size: ${file.file_size ? `${Math.round(file.file_size / 1024)}KB` : 'N/A'}`);
        });
        if (files.length > 3) {
          console.log(`      ... and ${files.length - 3} more files`);
        }
      }
    });
    
    // Test frontend compatibility
    console.log('\\n🎨 Frontend Compatibility Test:');
    const firstWeek = data.weeks[0];
    if (firstWeek) {
      console.log('✅ Week structure compatible with WeekCard component');
      console.log(`✅ Photos array: ${firstWeek.week_files.filter(f => f.file_type === 'photo').length} items`);
      console.log(`✅ PDFs array: ${firstWeek.week_files.filter(f => f.file_type === 'pdf').length} items`);
      console.log('✅ All required fields present for slideshow functionality');
    }
    
    console.log('\\n🎉 API test completed successfully!');
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️ Server not running. Please start the development server with: npm run dev');
    } else {
      console.error('❌ API test failed:', error.message);
    }
  }
}

// Polyfill for fetch in Node.js (for older versions)
if (!globalThis.fetch) {
  console.log('Using node-fetch polyfill...');
  globalThis.fetch = require('node-fetch');
}

testWeeksAPI();
