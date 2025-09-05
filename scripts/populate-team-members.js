const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const teamMembers = [
  { name: 'Dileep Babu', roll_number: '23021A0525', position: 'Team Member' },
  { name: 'Kavitha', roll_number: '23021A0526', position: 'Team Member' },
  { name: 'Praharshita', roll_number: '23021A0527', position: 'Team Member' },
  { name: 'Vijay Kumar', roll_number: '23021A0528', position: 'Team Member' },
  { name: 'Chandini', roll_number: '23021A0529', position: 'Team Member' },
  { name: 'Naga Lakshmi', roll_number: '23021A0530', position: 'Team Member' },
  { name: 'Adarsh Reddy', roll_number: '23021A0531', position: 'Team Member' },
  { name: 'Chaitanya Naidu', roll_number: '23021A0532', position: 'Team Member' },
  { name: 'Durga Dhanush', roll_number: '23021A0533', position: 'Team Member' },
  { name: 'Yashwant', roll_number: '23021A0534', position: 'Team Member' },
  { name: 'Divya', roll_number: '23021A0535', position: 'Team Member' }
];

async function populateTeamMembers() {
  try {
    console.log('Populating team members...');
    
    // First, clear existing team members
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.log('Note: Could not clear existing team members:', deleteError.message);
    }
    
    // Insert new team members
    const { data, error } = await supabase
      .from('team_members')
      .insert(teamMembers)
      .select();
    
    if (error) {
      console.error('Error inserting team members:', error);
      return;
    }
    
    console.log('Successfully populated team members:', data.length);
    console.log('Team members:', data.map(member => `${member.name} (${member.roll_number})`));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

populateTeamMembers();