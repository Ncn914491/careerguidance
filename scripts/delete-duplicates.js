// Script to delete duplicate career resources
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const deleteDuplicates = async () => {
  console.log('🗑️  Finding and deleting duplicate career resources...\n');

  try {
    // Get all career resources
    const { data: resources, error } = await supabase
      .from('career_resources')
      .select('*')
      .order('created_at', { ascending: true }); // Keep the oldest

    if (error) {
      console.error('❌ Error fetching resources:', error.message);
      return;
    }

    // Group by title and type to find duplicates
    const resourceGroups = {};
    resources.forEach(resource => {
      const key = `${resource.title}-${resource.resource_type}`;
      if (!resourceGroups[key]) resourceGroups[key] = [];
      resourceGroups[key].push(resource);
    });

    // Find duplicates
    const duplicates = Object.entries(resourceGroups)
      .filter(([key, items]) => items.length > 1)
      .map(([key, items]) => ({ key, items }));

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`Found ${duplicates.length} duplicate groups:`);
    
    for (const { key, items } of duplicates) {
      console.log(`\n📂 "${items[0].title}" (${items[0].resource_type}) - ${items.length} copies`);
      
      // Keep the first (oldest) and delete the rest
      const toKeep = items[0];
      const toDelete = items.slice(1);
      
      console.log(`   ✅ Keeping: ${toKeep.id} (created ${toKeep.created_at})`);
      
      for (const duplicate of toDelete) {
        console.log(`   🗑️  Deleting: ${duplicate.id} (created ${duplicate.created_at})`);
        
        // Delete the duplicate
        const { error: deleteError } = await supabase
          .from('career_resources')
          .delete()
          .eq('id', duplicate.id);
        
        if (deleteError) {
          console.log(`     ❌ Failed to delete: ${deleteError.message}`);
        } else {
          console.log(`     ✅ Deleted successfully`);
        }
      }
    }

    console.log('\n🎉 Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
};

deleteDuplicates();
