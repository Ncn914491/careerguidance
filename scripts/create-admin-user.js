#!/usr/bin/env node

/**
 * Create admin user for Career Guidance Project
 */

const { createClient } = require('@supabase/supabase-js');

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

async function createAdminUser() {
  console.log('👤 Creating admin user...');
  
  const adminEmail = 'nchaitanyanaidu@yahoo.com';
  const adminPassword = 'adminncn@20';
  
  try {
    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Admin user already exists in auth');
        
        // Get existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.users.find(u => u.email === adminEmail);
        if (!existingUser) {
          throw new Error('Could not find existing admin user');
        }
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', existingUser.id)
          .single();
        
        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: existingUser.id,
              email: adminEmail,
              full_name: 'Admin User',
              role: 'admin'
            });
          
          if (insertError) throw insertError;
          console.log('✅ Admin profile created');
        } else if (profile && profile.role !== 'admin') {
          // Update role to admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);
          
          if (updateError) throw updateError;
          console.log('✅ User role updated to admin');
        } else {
          console.log('✅ Admin profile already exists with correct role');
        }
        
        return;
      } else {
        throw authError;
      }
    }
    
    if (!authData.user) {
      throw new Error('No user data returned');
    }
    
    console.log('✅ Admin user created in auth');
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        full_name: 'Admin User',
        role: 'admin'
      });
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      throw profileError;
    }
    
    console.log('✅ Admin profile created');
    console.log(`📧 Admin email: ${adminEmail}`);
    console.log(`🔑 Admin password: ${adminPassword}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Creating admin user for Career Guidance Project\n');
  await createAdminUser();
  console.log('\n🎉 Admin user setup completed!');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});