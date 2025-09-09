const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const API_BASE_URL = 'http://localhost:3000/api'; // Assuming app is running locally

async function runTests() {
  let accessToken = null;
  let userId = null;

  // 1. Login as dummy user
  console.log('\n--- Attempting to log in as testuser@example.com ---');
  try {
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123',
      }),
    });
    const loginData = await loginResponse.json();

    if (loginData.access_token) {
      accessToken = loginData.access_token;
      userId = loginData.user.id;
      console.log('Login successful. Access Token obtained.');
    } else {
      console.error('Login failed:', loginData.error_description || loginData.msg);
      return;
    }
  } catch (error) {
    console.error('Error during login:', error);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  // 2. Attempt to create a group (should fail for non-admin user)
  console.log('\n--- Attempting to create a group (expected to fail for non-admin) ---');
  try {
    const createGroupResponse = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Test Group',
        description: 'A group created by automated test.',
      }),
    });
    const createGroupData = await createGroupResponse.json();
    console.log('Create group response:', createGroupData);
    if (createGroupResponse.ok) {
      console.warn('Group creation unexpectedly succeeded. Check user role.');
    } else {
      console.log('Group creation failed as expected (non-admin).');
    }
  } catch (error) {
    console.error('Error during group creation attempt:', error);
  }

  // 3. Attempt to join an existing group (assuming one exists with ID 'some-group-id')
  //    You might need to manually create a group via admin panel or another script
  //    and replace 'some-group-id' with an actual group ID.
  console.log('\n--- Attempting to join an existing group ---');
  const existingGroupId = 'YOUR_EXISTING_GROUP_ID_HERE'; // <<< IMPORTANT: Replace this
  if (existingGroupId === 'YOUR_EXISTING_GROUP_ID_HERE') {
    console.warn('Skipping join group test: Please replace YOUR_EXISTING_GROUP_ID_HERE with an actual group ID.');
  } else {
    try {
      const joinGroupResponse = await fetch(`${API_BASE_URL}/groups/${existingGroupId}/join`, {
        method: 'POST',
        headers: authHeaders,
      });
      const joinGroupData = await joinGroupResponse.json();
      console.log('Join group response:', joinGroupData);
      if (joinGroupResponse.ok) {
        console.log('Successfully joined group.');
      } else {
        console.error('Failed to join group:', joinGroupData.error);
      }
    } catch (error) {
      console.error('Error during join group attempt:', error);
    }
  }

  // 4. Attempt to use AI Chat
  console.log('\n--- Attempting to use AI Chat ---');
  try {
    const aiChatResponse = await fetch(`${API_BASE_URL}/ai-chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: 'Hello AI, what is career guidance?' }),
    });
    const aiChatData = await aiChatResponse.json();
    console.log('AI Chat response:', aiChatData);
    if (aiChatResponse.ok) {
      console.log('AI Chat successful.');
    } else {
      console.error('AI Chat failed:', aiChatData.error);
    }
  } catch (error) {
    console.error('Error during AI Chat attempt:', error);
  }

  console.log('\n--- Tests Finished ---');
}

runTests();