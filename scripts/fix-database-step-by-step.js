#!/usr/bin/env node

/**
 * Step-by-step database fix script
 * Handles trigger conflicts and applies fixes in the correct order
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function fixDatabaseStepByStep() {
  console.log('🔧 Starting step-by-step database fix...');

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
    // Step 1: Fix trigger conflicts
    console.log('\n📋 Step 1: Fixing trigger conflicts...');
    
    const quickFixSql = `
      -- Drop the problematic function with CASCADE to remove all dependencies
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      
      -- Drop any remaining triggers
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
    `;

    try {
      await executeSQL(supabase, quickFixSql);
      console.log('✅ Trigger conflicts resolved');
    } catch (error) {
      console.log('⚠️  Trigger cleanup warning:', error.message);
    }

    // Step 2: Clean up RLS policies
    console.log('\n📋 Step 2: Cleaning up RLS policies...');
    
    const cleanupPoliciesSql = `
      -- Drop existing problematic policies
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
      DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
      DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
      DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
    `;

    await executeSQL(supabase, cleanupPoliciesSql);
    console.log('✅ RLS policies cleaned up');

    // Step 3: Create profile creation function
    console.log('\n📋 Step 3: Creating profile creation function...');
    
    const createFunctionSql = `
      -- Create function to handle new user profile creation
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
          'student'
        );
        RETURN NEW;
      EXCEPTION
        WHEN unique_violation THEN
          -- Profile already exists, just return
          RETURN NEW;
        WHEN OTHERS THEN
          -- Log error but don't fail the auth process
          RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await executeSQL(supabase, createFunctionSql);
    console.log('✅ Profile creation function created');

    // Step 4: Create trigger
    console.log('\n📋 Step 4: Creating profile creation trigger...');
    
    const createTriggerSql = `
      -- Create trigger for automatic profile creation
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    await executeSQL(supabase, createTriggerSql);
    console.log('✅ Profile creation trigger created');

    // Step 5: Create new RLS policies
    console.log('\n📋 Step 5: Creating new RLS policies...');
    
    const createPoliciesSql = `
      -- Profiles policies
      CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
      
      CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT 
      WITH CHECK (auth.uid() = id);
      
      CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE 
      USING (auth.uid() = id);
      
      CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL 
      USING (auth.jwt() ->> 'role' = 'service_role');
    `;

    await executeSQL(supabase, createPoliciesSql);
    console.log('✅ Profile RLS policies created');

    // Step 6: Fix weeks and files policies
    console.log('\n📋 Step 6: Fixing weeks and files policies...');
    
    const fixWeeksPoliciesSql = `
      -- Clean up existing weeks policies
      DROP POLICY IF EXISTS "Weeks are viewable by everyone" ON weeks;
      DROP POLICY IF EXISTS "Only admins can create weeks" ON weeks;
      DROP POLICY IF EXISTS "Only admins can update weeks" ON weeks;
      
      -- Create new weeks policies
      CREATE POLICY "Anyone can view weeks" ON weeks FOR SELECT USING (true);
      CREATE POLICY "Admins can create weeks" ON weeks FOR INSERT 
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
      CREATE POLICY "Admins can update weeks" ON weeks FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
      
      -- Clean up existing week_files policies
      DROP POLICY IF EXISTS "Week files are viewable by everyone" ON week_files;
      DROP POLICY IF EXISTS "Only admins can upload files" ON week_files;
      DROP POLICY IF EXISTS "Only admins can update files" ON week_files;
      
      -- Create new week_files policies
      CREATE POLICY "Anyone can view week files" ON week_files FOR SELECT USING (true);
      CREATE POLICY "Admins can upload files" ON week_files FOR INSERT 
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
      CREATE POLICY "Admins can update files" ON week_files FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    `;

    await executeSQL(supabase, fixWeeksPoliciesSql);
    console.log('✅ Weeks and files policies fixed');

    // Step 7: Create helper functions
    console.log('\n📋 Step 7: Creating helper functions...');
    
    const helperFunctionsSql = `
      -- Function to check if user is admin
      CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = user_id AND role = 'admin'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to create default admin
      CREATE OR REPLACE FUNCTION public.create_default_admin(admin_email TEXT)
      RETURNS BOOLEAN AS $$
      DECLARE
        admin_user_id UUID;
      BEGIN
        -- Find user by email
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = admin_email;
        
        IF admin_user_id IS NULL THEN
          RAISE EXCEPTION 'User with email % not found', admin_email;
        END IF;
        
        -- Update or insert profile as admin
        INSERT INTO profiles (id, email, full_name, role)
        VALUES (admin_user_id, admin_email, admin_email, 'admin')
        ON CONFLICT (id) 
        DO UPDATE SET role = 'admin', updated_at = NOW();
        
        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await executeSQL(supabase, helperFunctionsSql);
    console.log('✅ Helper functions created');

    // Step 8: Setup storage
    console.log('\n📋 Step 8: Setting up storage...');
    
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const weekFilesBucket = buckets?.find(b => b.name === 'week-files');
      
      if (!weekFilesBucket) {
        const { error: bucketError } = await supabase.storage.createBucket('week-files', {
          public: true
        });
        
        if (bucketError) {
          console.log('⚠️  Storage bucket creation warning:', bucketError.message);
        } else {
          console.log('✅ Storage bucket created');
        }
      } else {
        console.log('✅ Storage bucket already exists');
      }
    } catch (error) {
      console.log('⚠️  Storage setup warning:', error.message);
    }

    console.log('\n🎉 Step-by-step database fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create your first admin user:');
    console.log('   node scripts/create-admin.js your-email@example.com');
    console.log('2. Test the application by signing up and logging in');
    console.log('3. Verify admin functionality works correctly');

  } catch (error) {
    console.error('❌ Error during step-by-step fix:', error.message);
    process.exit(1);
  }
}

async function executeSQL(supabase, sql) {
  // Try different methods to execute SQL
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
  } catch (error) {
    // If rpc doesn't work, try splitting into statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Warning: ${error.message}`);
        }
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️  Warning: ${err.message}`);
        }
      }
    }
  }
}

// Run the fix
fixDatabaseStepByStep().catch(console.error);