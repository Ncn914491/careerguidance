const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSeed() {
  try {
    console.log('Reading seed.sql file...')
    
    const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql')
    const seedSQL = fs.readFileSync(seedPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error)
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    }
    
    console.log('Seed execution completed!')
    
    // Verify the data was inserted
    const { data: teams, error: teamError } = await supabase
      .from('team_members')
      .select('count(*)')
      .single()
    
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('count(*)')
      .single()
      
    const { data: groups, error: groupError } = await supabase
      .from('groups')
      .select('count(*)')
      .single()
    
    if (!teamError && !schoolError && !groupError) {
      console.log(`✅ Verification: ${teams.count} team members, ${schools.count} schools, ${groups.count} groups`)
    }
    
  } catch (error) {
    console.error('Error running seed:', error)
  }
}

runSeed()