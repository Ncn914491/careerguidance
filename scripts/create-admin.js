#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-admin.js <email>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide an email address');
    console.error('Usage: node scripts/create-admin.js <email>');
    process.exit(1);
  }

  console.log(`🔧 Creating admin user for: ${email}`);

  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // First, check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError.message);
      process.exit(1);
    }

    const existingUser = authUsers.users.find(user => user.email === email);
    
    if (!existingUser) {
      console.error(`❌ User with email ${email} not found in auth.users`);
      console.error('Please make sure the user has signed up first, then run this script');
      process.exit(1);
    }

    console.log(`✅ Found user: ${existingUser.id}`);

    // Update or create profile as admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: existingUser.id,
        email: email,
        full_name: existingUser.user_metadata?.full_name || email,
        role: 'admin'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError.message);
      process.exit(1);
    }

    console.log('✅ Admin profile created/updated successfully!');
    console.log(`📋 Profile details:`, {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name
    });

    // Verify admin permissions
    console.log('🔍 Verifying admin permissions...');
    
    const { data: testWeeks, error: testError } = await supabase
      .from('weeks')
      .select('*')
      .limit(1);

    if (testError) {
      console.warn('⚠️  Warning: Could not test weeks access:', testError.message);
    } else {
      console.log('✅ Admin can access weeks table');
    }

    console.log('\n🎉 Admin user setup completed!');
    console.log(`\n📋 Next steps:`);
    console.log(`1. Log in to the application with: ${email}`);
    console.log(`2. Navigate to /admin to access admin features`);
    console.log(`3. Test uploading week content`);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdmin().catch(console.error);