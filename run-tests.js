const { spawn } = require('child_process');

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function runTests() {
  try {
    console.log('🧪 Running authentication and functionality tests...\n');
    
    // Install test dependencies if needed
    console.log('📦 Installing test dependencies...');
    await runCommand('npm', ['install', '--save-dev', '@testing-library/react', '@testing-library/jest-dom', 'jest', 'jest-environment-jsdom']);
    
    // Run Jest tests
    console.log('\n🔍 Running unit tests...');
    await runCommand('npm', ['test', '--', '--watchAll=false']);
    
    console.log('\n✅ All tests completed!');
    
    // Instructions for manual testing
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:3000');
    console.log('3. Test authentication flow:');
    console.log('   - Try accessing /admin/dashboard (should redirect to login)');
    console.log('   - Try accessing /student/dashboard (should redirect to login)');
    console.log('   - Create admin user: POST /api/create-admin');
    console.log('   - Login with admin credentials');
    console.log('   - Check if admin dashboard loads properly');
    console.log('   - Check if weeks data is visible');
    console.log('   - Check if groups functionality works');
    console.log('4. Run: node test-auth.js (after starting server)');
    
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

runTests();