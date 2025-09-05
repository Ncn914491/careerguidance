const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sampleSchools = [
  { 
    name: "St. Mary's High School", 
    location: "Delhi", 
    visit_date: "2024-01-15" 
  },
  { 
    name: "Delhi Public School", 
    location: "New Delhi", 
    visit_date: "2024-01-22" 
  },
  { 
    name: "Kendriya Vidyalaya", 
    location: "Central Delhi", 
    visit_date: "2024-02-05" 
  },
  { 
    name: "Modern School", 
    location: "Barakhamba Road", 
    visit_date: "2024-02-12" 
  },
  { 
    name: "Ryan International School", 
    location: "Vasant Kunj", 
    visit_date: "2024-02-19" 
  },
  { 
    name: "DAV Public School", 
    location: "Pushpanjali Enclave", 
    visit_date: "2024-02-26" 
  },
  { 
    name: "Bal Bharati Public School", 
    location: "Pitampura", 
    visit_date: "2024-03-05" 
  },
  { 
    name: "Sardar Patel Vidyalaya", 
    location: "Lodi Estate", 
    visit_date: "2024-03-12" 
  }
];

async function populateSampleSchools() {
  try {
    console.log('Populating sample schools...');
    
    // Check for existing schools to avoid duplicates
    const { data: existingSchools } = await supabase
      .from('schools')
      .select('name');
    
    const existingNames = new Set(existingSchools?.map(s => s.name) || []);
    
    const newSchools = sampleSchools.filter(school => 
      !existingNames.has(school.name)
    );
    
    if (newSchools.length === 0) {
      console.log('All sample schools already exist in the database.');
      return;
    }
    
    // Insert new schools
    const { data, error } = await supabase
      .from('schools')
      .insert(newSchools)
      .select();
    
    if (error) {
      console.error('Error inserting schools:', error);
      return;
    }
    
    console.log('Successfully populated sample schools:', data.length);
    console.log('Schools:', data.map(school => `${school.name} - ${school.location}`));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

populateSampleSchools();