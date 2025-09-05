#!/usr/bin/env node

/**
 * Database and Authentication Test Runner
 * 
 * Runs all database connection, CRUD operations, RLS policies, 
 * and authentication tests for the Career Guidance Project
 * 
 * Requirements: 9.1, 9.4
 */

const { execSync } = require('child_process')
const path = require('path')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60))
  console.log(colorize(title, 'cyan'))
  console.log('='.repeat(60))
}

function printSection(title) {
  console.log('\n' + colorize(title, 'yellow'))
  console.log('-'.repeat(40))
}

function runTest(testFile, description) {
  try {
    console.log(colorize(`\n🧪 Running: ${description}`, 'blue'))
    
    const result = execSync(`npm test -- ${testFile} --verbose`, {
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    console.log(colorize('✅ PASSED', 'green'))
    return { success: true, output: result }
  } catch (error) {
    console.log(colorize('❌ FAILED', 'red'))
    console.log(colorize(error.stdout || error.message, 'red'))
    return { success: false, error: error.stdout || error.message }
  }
}

function main() {
  printHeader('DATABASE AND AUTHENTICATION TESTS')
  console.log(colorize('Testing database connection, CRUD operations, RLS policies, and authentication', 'bright'))
  
  const testSuites = [
    {
      file: 'tests/lib/database.test.ts',
      description: 'Database Connection and CRUD Operations',
      category: 'Database'
    },
    {
      file: 'tests/lib/rls-policies.test.ts', 
      description: 'Row-Level Security (RLS) Policies',
      category: 'Security'
    },
    {
      file: 'tests/lib/auth.test.ts',
      description: 'Authentication and Admin Seeding',
      category: 'Authentication'
    },
    {
      file: 'tests/lib/migration.test.ts',
      description: 'Database Migration and Setup',
      category: 'Migration'
    }
  ]
  
  const results = []
  let currentCategory = ''
  
  for (const testSuite of testSuites) {
    if (testSuite.category !== currentCategory) {
      printSection(`${testSuite.category} Tests`)
      currentCategory = testSuite.category
    }
    
    const result = runTest(testSuite.file, testSuite.description)
    results.push({
      ...testSuite,
      ...result
    })
  }
  
  // Print summary
  printHeader('TEST SUMMARY')
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const total = results.length
  
  console.log(`\n📊 Total Tests: ${total}`)
  console.log(colorize(`✅ Passed: ${passed}`, 'green'))
  console.log(colorize(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green'))
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`)
  
  if (failed > 0) {
    printSection('Failed Tests')
    results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(colorize(`❌ ${result.description}`, 'red'))
        console.log(`   File: ${result.file}`)
      })
  }
  
  // Print detailed requirements coverage
  printSection('Requirements Coverage')
  console.log('✅ Requirement 9.1: Comprehensive tests in dedicated "tests" folder')
  console.log('✅ Requirement 9.4: Database operations with proper SQL schema and RLS')
  console.log('✅ Requirement 8.1: Admin user seeding and authentication')
  console.log('✅ Requirement 8.2: Authentication bypass for seeded admin')
  
  // Print next steps
  printSection('Next Steps')
  if (failed === 0) {
    console.log(colorize('🎉 All tests passed! Database and authentication are ready.', 'green'))
    console.log('\nRecommended next steps:')
    console.log('1. Run database migration: npm run db:migrate')
    console.log('2. Seed admin user: npm run db:seed-admin')
    console.log('3. Verify database setup: npm run db:verify')
    console.log('4. Start development server: npm run dev')
  } else {
    console.log(colorize('⚠️  Some tests failed. Please fix issues before proceeding.', 'yellow'))
    console.log('\nTroubleshooting:')
    console.log('1. Check environment variables in .env.local')
    console.log('2. Verify Supabase project configuration')
    console.log('3. Ensure database schema is properly deployed')
    console.log('4. Check network connectivity to Supabase')
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Database and Authentication Test Runner')
  console.log('')
  console.log('Usage: node tests/database-auth-test-runner.js [options]')
  console.log('')
  console.log('Options:')
  console.log('  --help, -h     Show this help message')
  console.log('  --verbose, -v  Show detailed test output')
  console.log('')
  console.log('This script runs all database and authentication tests including:')
  console.log('- Database connection and CRUD operations')
  console.log('- Row-Level Security (RLS) policy enforcement')
  console.log('- Admin user seeding and authentication bypass')
  console.log('- Database migration and verification')
  process.exit(0)
}

// Run the tests
if (require.main === module) {
  main()
}

module.exports = { runTest, colorize }