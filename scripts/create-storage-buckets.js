const { createClient } = require('@supabase/supabase-js');
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

async function createStorageBuckets() {
  console.log('🗂️  Creating Supabase storage buckets for career resources...\n');

  const buckets = [
    { name: 'career-photos', allowedMimeTypes: ['image/*'] },
    { name: 'career-pdfs', allowedMimeTypes: ['application/pdf'] },
    { name: 'career-ppts', allowedMimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'] }
  ];

  try {
    // List existing buckets
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const existingBucketNames = existingBuckets.map(bucket => bucket.name);
    console.log('📋 Existing buckets:', existingBucketNames);

    for (const bucket of buckets) {
      if (existingBucketNames.includes(bucket.name)) {
        console.log(`✅ Bucket '${bucket.name}' already exists`);
        continue;
      }

      console.log(`📦 Creating bucket: ${bucket.name}`);
      
      const { data, error } = await supabaseAdmin.storage.createBucket(bucket.name, {
        public: true,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
      });

      if (error) {
        console.error(`❌ Error creating bucket '${bucket.name}':`, error);
      } else {
        console.log(`✅ Created bucket: ${bucket.name}`);
      }
    }

    console.log('\n🎉 Storage buckets setup completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createStorageBuckets();
