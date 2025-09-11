#!/usr/bin/env node

/**
 * Database Seeding Script - Update with Real Data
 * 
 * This script updates the database with real school names and team member data
 * Usage: node scripts/seed-real-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Real school data
const schools = [
  {
    name: 'Gaigolupadu Government School',
    location: 'Gaigolupadu',
    visit_date: '2024-01-15'
  },
  {
    name: 'Ananda Nilayam Hostel',
    location: 'Ananda Nilayam',
    visit_date: '2024-02-20'
  },
  {
    name: 'Municipal Corporation School (Kondaya Palem)',
    location: 'Kondaya Palem',
    visit_date: '2024-03-10'
  },
  {
    name: 'Sanjeev Synergy School',
    location: 'Sanjeev Synergy',
    visit_date: '2024-04-05'
  }
];

// Real team member data with roll numbers 23032A0525-35
const teamMembers = [
  { name: 'Dileep Babu', roll_number: '23032A0525', position: null },
  { name: 'Kavitha', roll_number: '23032A0526', position: null },
  { name: 'Praharshita', roll_number: '23032A0527', position: null },
  { name: 'Vijay Kumar', roll_number: '23032A0528', position: null },
  { name: 'Chandini', roll_number: '23032A0529', position: null },
  { name: 'Naga Lakshmi', roll_number: '23032A0530', position: null },
  { name: 'Adarsh Reddy', roll_number: '23032A0531', position: null },
  { name: 'Chaitanya Naidu', roll_number: '23032A0532', position: null },
  { name: 'Durga Dhanush', roll_number: '23032A0533', position: null },
  { name: 'Yashwanth Reddy', roll_number: '23032A0534', position: null },
  { name: 'Divya', roll_number: '23032A0535', position: null }
];

async function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARNING: '\x1b[33m',
    RESET: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${type}] ${timestamp}: ${message}${colors.RESET}`);
}

async function clearExistingData() {
  log('Clearing existing dummy data...');
  
  // Clear existing schools
  const { error: schoolsError } = await supabase
    .from('schools')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible UUID)
  
  if (schoolsError) {
    log(`Error clearing schools: ${schoolsError.message}`, 'ERROR');
    throw schoolsError;
  }
  
  // Clear existing team members
  const { error: teamError } = await supabase
    .from('team_members')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (teamError) {
    log(`Error clearing team members: ${teamError.message}`, 'ERROR');
    throw teamError;
  }
  
  log('✓ Existing data cleared', 'SUCCESS');
}

async function seedSchools() {
  log('Seeding schools with real data...');
  
  const { data, error } = await supabase
    .from('schools')
    .insert(schools)
    .select();
  
  if (error) {
    log(`Error seeding schools: ${error.message}`, 'ERROR');
    throw error;
  }
  
  log(`✓ Successfully seeded ${data.length} schools`, 'SUCCESS');
  data.forEach(school => {
    log(`  - ${school.name} (${school.location})`, 'INFO');
  });
}

async function seedTeamMembers() {
  log('Seeding team members with real data...');
  
  const { data, error } = await supabase
    .from('team_members')
    .insert(teamMembers)
    .select();
  
  if (error) {
    log(`Error seeding team members: ${error.message}`, 'ERROR');
    throw error;
  }
  
  log(`✓ Successfully seeded ${data.length} team members`, 'SUCCESS');
  data.forEach(member => {
    log(`  - ${member.name} (${member.roll_number})`, 'INFO');
  });
}

async function verifyData() {
  log('Verifying seeded data...');
  
  // Verify schools
  const { data: schoolsData, error: schoolsError } = await supabase
    .from('schools')
    .select('*')
    .order('name');
  
  if (schoolsError) {
    log(`Error verifying schools: ${schoolsError.message}`, 'ERROR');
    throw schoolsError;
  }
  
  // Verify team members
  const { data: teamData, error: teamError } = await supabase
    .from('team_members')
    .select('*')
    .order('roll_number');
  
  if (teamError) {
    log(`Error verifying team members: ${teamError.message}`, 'ERROR');
    throw teamError;
  }
  
  log(`✓ Verification complete:`, 'SUCCESS');
  log(`  - Schools: ${schoolsData.length}`, 'INFO');
  log(`  - Team Members: ${teamData.length}`, 'INFO');
  
  return {
    schools: schoolsData,
    teamMembers: teamData
  };
}

async function main() {
  try {
    log('🚀 Starting database seeding with real data...');
    
    // Check if Supabase credentials are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials. Please check your .env.local file.');
    }
    
    await clearExistingData();
    await seedSchools();
    await seedTeamMembers();
    const verification = await verifyData();
    
    log('🎉 Database seeding completed successfully!', 'SUCCESS');
    log('Summary:', 'INFO');
    log(`  - ${verification.schools.length} schools updated`, 'SUCCESS');
    log(`  - ${verification.teamMembers.length} team members updated`, 'SUCCESS');
    
    process.exit(0);
    
  } catch (error) {
    log(`❌ Seeding failed: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  schools,
  teamMembers
};
