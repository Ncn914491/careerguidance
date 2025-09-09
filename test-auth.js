// Simple test script to check authentication and data
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('Testing authentication and data endpoints...\n');
    
    // Test database connectivity
    const testAuth = await fetch(`${baseUrl}/api/test-auth`);
    const testAuthData = await testAuth.json();
    console.log('Database Test:', JSON.stringify(testAuthData, null, 2));
    
    // Test weeks endpoint
    const weeksResponse = await fetch(`${baseUrl}/api/weeks`);
    const weeksData = await weeksResponse.json();
    console.log('\nWeeks Data:', JSON.stringify(weeksData, null, 2));
    
    // Test create admin endpoint (development only)
    const createAdminResponse = await fetch(`${baseUrl}/api/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123',
        fullName: 'Test Admin'
      })
    });
    const createAdminData = await createAdminResponse.json();
    console.log('\nCreate Admin Test:', JSON.stringify(createAdminData, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testEndpoints();