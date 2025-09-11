const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajkutxlqgonhsagtjrvs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3V0eGxxZ29uaHNhZ3RqcnZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTgwNzU0MCwiZXhwIjoyMDQxMzgzNTQwfQ.GNsaF7QG4h0a7Lc5E64cVGjD6bgJ4FhQJJsLCQNIKz8';

async function testCareerResourceCreation() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔍 Testing Career Resource Creation...');
  
  try {
    // Check if table exists and get current data
    const { data: existingResources, error: fetchError } = await supabase
      .from('career_resources')
      .select('*')
      .limit(5);
      
    if (fetchError) {
      console.error('❌ Error fetching existing resources:', fetchError);
      return;
    }
    
    console.log('📋 Current career resources count:', existingResources?.length || 0);
    
    // Create a simple test resource
    const testResource = {
      title: 'Test Career Resource - UI Debug',
      description: 'This is a test resource created to verify UI functionality',
      resource_type: 'text',
      content_text: 'This is sample career guidance content for testing the admin UI. You should be able to see this resource in the admin panel and delete it using the trash icon.',
      display_order: (existingResources?.length || 0),
      is_featured: false
    };
    
    const { data: newResource, error: insertError } = await supabase
      .from('career_resources')
      .insert([testResource])
      .select();
      
    if (insertError) {
      console.error('❌ Error creating test resource:', insertError);
      return;
    }
    
    console.log('✅ Successfully created test resource:', newResource[0].id);
    console.log('📄 Resource title:', newResource[0].title);
    console.log('🎯 You should now see this resource in the admin panel with a delete button');
    
    // Verify it can be fetched
    const { data: allResources, error: verifyError } = await supabase
      .from('career_resources')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (verifyError) {
      console.error('❌ Error verifying resources:', verifyError);
      return;
    }
    
    console.log('📊 Total resources after creation:', allResources?.length || 0);
    console.log('🆕 Latest resource:', allResources?.[0]?.title || 'None');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCareerResourceCreation();
