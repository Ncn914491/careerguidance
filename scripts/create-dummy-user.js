const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin actions

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDummyUser() {
  const email = 'testuser@example.com';
  const password = 'password123';
  const fullName = 'Test User';

  try {
    console.log(`Attempting to create user: ${email}`);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: { full_name: fullName }
    });

    if (error) {
      if (error.message.includes('User already exists')) {
        console.log(`User ${email} already exists. Skipping creation.`);
        return;
      }
      throw error;
    }

    console.log('Dummy user created successfully:', data.user.id);
  } catch (error) {
    console.error('Error creating dummy user:', error.message);
  }
}

createDummyUser();
