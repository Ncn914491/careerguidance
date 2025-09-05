#!/usr/bin/env node

/**
 * Comprehensive test runner for the Career Guidance Website
 * Runs all tests and provides detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting comprehensive test suite...\n');

// Test categories
const testCategories = [
  {
    name: 'Authentication Tests',
    pattern: 'tests/auth.test.ts',
    description: 'Login/Signup flow validation'
  },
  {
    name: 'Role-Based Access Control',
    pattern: 'tests/role.test.ts',
    description: 'Admin vs Student role separation'
  },
  {
    name: 'Dashboard Access Tests',
    pattern: 'tests/dashboard.test.ts',
    description: 'Dashboard functionality and access control'
  },
  {
    name: 'Environment Validation',
    pattern: 'tests/env-validation.test.ts',
    description: 'Environment variable validation for Vercel'
  },
  {
    name: 'API Tests',
    pattern: 'tests/api/**/*.test.ts',
    description: 'API endpoint functionality'
  },
  {
    name: 'Integration Tests',
    pattern: 'tests/integration/**/*.test.ts',
    description: 'End-to-end workflow validation'
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function runTestCategory(category) {
  console.log(`\n📋 Running: ${category.name}`);
  console.log(`   ${category.description}`);
  console.log(`   Pattern: ${category.pattern}\n`);

  try {
    const output = execSync(`npx jest ${category.pattern} --verbose --no-coverage`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Parse Jest output for test counts
    const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (testMatch) {
      const passed = parseInt(testMatch[1]);
      const total = parseInt(testMatch[2]);
      
      totalTests += total;
      passedTests += passed;
      
      results.push({
        category: category.name,
        passed,
        total,
        status: 'PASSED'
      });
      
      console.log(`✅ ${category.name}: ${passed}/${total} tests passed`);
    } else {
      console.log(`✅ ${category.name}: All tests passed`);
      results.push({
        category: category.name,
        passed: 'All',
        total: 'All',
        status: 'PASSED'
      });
    }
  } catch (error) {
    console.log(`❌ ${category.name}: Tests failed`);
    console.log(error.stdout || error.message);
    
    failedTests++;
    results.push({
      category: category.name,
      passed: 0,
      total: '?',
      status: 'FAILED',
      error: error.message
    });
  }
}

// Run all test categories
testCategories.forEach(runTestCategory);

// Generate summary report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY REPORT');
console.log('='.repeat(60));

results.forEach(result => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${status} ${result.category}: ${result.passed}/${result.total}`);
});

console.log('\n' + '-'.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

// Check for Vercel deployment readiness
console.log('\n' + '='.repeat(60));
console.log('🚀 VERCEL DEPLOYMENT READINESS CHECK');
console.log('='.repeat(60));

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      const envExample = fs.existsSync('.env.local');
      const envValidation = fs.existsSync('src/lib/env-validation.ts');
      return envExample && envValidation;
    }
  },
  {
    name: 'Vercel Configuration',
    check: () => fs.existsSync('vercel.json')
  },
  {
    name: 'Build Scripts',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts.build && pkg.scripts.start;
    }
  },
  {
    name: 'TypeScript Configuration',
    check: () => fs.existsSync('tsconfig.json')
  },
  {
    name: 'Next.js Configuration',
    check: () => fs.existsSync('next.config.ts') || fs.existsSync('next.config.js')
  }
];

let deploymentReady = true;

checks.forEach(check => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  
  if (!passed) {
    deploymentReady = false;
  }
});

console.log('\n' + '-'.repeat(60));
if (deploymentReady && failedTests === 0) {
  console.log('🎉 READY FOR VERCEL DEPLOYMENT!');
  console.log('All tests passed and deployment requirements met.');
} else {
  console.log('⚠️  NOT READY FOR DEPLOYMENT');
  if (failedTests > 0) {
    console.log(`Fix ${failedTests} failing test categories first.`);
  }
  if (!deploymentReady) {
    console.log('Complete deployment configuration requirements.');
  }
}

console.log('\n📚 Next Steps:');
console.log('1. Fix any failing tests');
console.log('2. Set up environment variables in Vercel dashboard');
console.log('3. Deploy using: vercel --prod');
console.log('4. Test deployed application thoroughly');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);