#!/usr/bin/env node

/**
 * Complete system setup script
 * Runs all necessary fixes and setup steps in the correct order
 */

const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: node ${scriptPath} ${args.join(' ')}`);
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupSystem() {
  console.log('🔧 Starting complete system setup...');
  console.log('This will apply all database fixes and prepare the system for use.\n');

  try {
    // Step 1: Apply comprehensive database fixes
    console.log('📋 Step 1: Applying comprehensive database fixes...');
    await runScript(path.join(__dirname, 'apply-comprehensive-fix.js'));

    // Step 2: Test the system
    console.log('\n📋 Step 2: Testing system functionality...');
    await runScript(path.join(__dirname, 'test-system.js'));

    console.log('\n🎉 System setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create your first admin user:');
    console.log('   node scripts/create-admin.js <your-email@example.com>');
    console.log('2. Start your development server:');
    console.log('   npm run dev');
    console.log('3. Navigate to /admin to test admin functionality');
    console.log('4. Test user signup and profile creation');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure your .env.local file has the correct Supabase credentials');
    console.error('2. Ensure your Supabase project is accessible');
    console.error('3. Check that you have the service role key (not anon key)');
    console.error('4. Try running individual scripts manually to isolate issues');
    process.exit(1);
  }
}

// Run the setup
setupSystem().catch(console.error);