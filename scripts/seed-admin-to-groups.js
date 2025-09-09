const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'nchaitanyanaidu@yahoo.com';

async function seedAdminToGroups() {
  try {
    // Add the 'role' column to the 'group_members' table if it doesn't exist
    console.log('Altering group_members table...');
    const { error: alterError } = await supabaseAdmin.rpc('exec', { sql: `
      DO $
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'role') THEN
          ALTER TABLE public.group_members ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member'));
        END IF;
      END
      $;
    `});

    if (alterError) {
      console.error('Error altering table:', alterError.message);
      //return;
    }

    // 1. Get the admin user ID
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (adminError || !adminUser) {
      console.error('Error fetching admin user:', adminError?.message || 'Admin not found');
      return;
    }
    const adminId = adminUser.id;
    console.log(`Found admin user with ID: ${adminId}`);

    // 2. Get all group IDs
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id');

    if (groupsError) {
      console.error('Error fetching groups:', groupsError.message);
      return;
    }

    if (!groups || groups.length === 0) {
      console.log('No groups found to add admin to.');
      return;
    }

    const groupIds = groups.map(g => g.id);
    console.log(`Found ${groupIds.length} groups.`);

    // 3. For each group, add the admin as a member
    const upsertPromises = groupIds.map(groupId => {
      return supabaseAdmin.from('group_members').upsert(
        {
          group_id: groupId,
          user_id: adminId,
          role: 'admin',
        },
        {
          onConflict: 'group_id,user_id',
        }
      );
    });

    const results = await Promise.all(upsertPromises);

    let successCount = 0;
    results.forEach((result, index) => {
      if (result.error) {
        console.error(`Failed to add admin to group ${groupIds[index]}:`, result.error.message);
      } else {
        successCount++;
      }
    });

    console.log(`Successfully added/updated admin in ${successCount} groups.`);

  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  } finally {
    console.log('Script finished.');
  }
}

seedAdminToGroups();
