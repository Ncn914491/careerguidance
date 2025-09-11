const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function uploadCSPPresentations() {
  console.log('📊 Uploading CSP presentations as career resources...\n');

  try {
    const cspFolderPath = path.join(process.cwd(), 'csp');
    
    // Check if CSP folder exists
    if (!fs.existsSync(cspFolderPath)) {
      console.error(`❌ CSP folder not found at: ${cspFolderPath}`);
      return;
    }

    // Find PPT files
    const files = fs.readdirSync(cspFolderPath);
    const pptFiles = files.filter(file => 
      file.toLowerCase().endsWith('.ppt') || file.toLowerCase().endsWith('.pptx')
    );

    console.log(`📋 Found ${pptFiles.length} PPT files:`);
    pptFiles.forEach(file => console.log(`  - ${file}`));

    if (pptFiles.length === 0) {
      console.log('⚠️  No PPT files found in CSP folder');
      return;
    }

    for (const fileName of pptFiles) {
      console.log(`\n🔄 Processing: ${fileName}`);
      
      const filePath = path.join(cspFolderPath, fileName);
      const fileBuffer = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);
      
      // Generate a unique filename for storage
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${Date.now()}_${fileName}`;

      try {
        // Upload to Supabase Storage
        console.log(`  📤 Uploading to storage...`);
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('career-ppts')
          .upload(uniqueFileName, fileBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            upsert: false
          });

        if (uploadError) {
          console.error(`  ❌ Upload error:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('career-ppts')
          .getPublicUrl(uploadData.path);

        console.log(`  ✅ Uploaded to: ${urlData.publicUrl}`);

        // Create career resource entry
        console.log(`  📝 Creating database entry...`);
        const { data: resourceData, error: resourceError } = await supabaseAdmin
          .from('career_resources')
          .insert({
            title: `CSP Presentation - ${baseName}`,
            description: 'Career guidance presentation from the CSP program',
            resource_type: 'ppt',
            content_text: null,
            display_order: 0,
            is_featured: true
          })
          .select()
          .single();

        if (resourceError) {
          console.error(`  ❌ Database error:`, resourceError);
          // Clean up uploaded file
          await supabaseAdmin.storage.from('career-ppts').remove([uploadData.path]);
          continue;
        }

        console.log(`  📊 Created resource: ${resourceData.id}`);

        // Create file entry
        const { data: fileData, error: fileError } = await supabaseAdmin
          .from('career_resource_files')
          .insert({
            career_resource_id: resourceData.id,
            file_name: fileName,
            file_type: 'ppt',
            file_url: urlData.publicUrl,
            file_size: fileStats.size
          });

        if (fileError) {
          console.error(`  ❌ File entry error:`, fileError);
          // Clean up
          await supabaseAdmin.from('career_resources').delete().eq('id', resourceData.id);
          await supabaseAdmin.storage.from('career-ppts').remove([uploadData.path]);
          continue;
        }

        console.log(`  ✅ Successfully uploaded: ${fileName}`);

      } catch (error) {
        console.error(`  ❌ Error processing ${fileName}:`, error);
      }
    }

    console.log('\n🎉 CSP presentations upload completed!');
    
    // Verify by listing resources
    const { data: resources, error: listError } = await supabaseAdmin
      .from('career_resources')
      .select('*, career_resource_files(*)')
      .eq('resource_type', 'ppt');

    if (!listError && resources) {
      console.log(`\n📋 Total PPT resources in database: ${resources.length}`);
      resources.forEach(resource => {
        console.log(`  - ${resource.title} (${resource.career_resource_files.length} file(s))`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

uploadCSPPresentations();
