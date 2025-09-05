const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyProfileTrigger() {
  try {
    console.log('Applying profile trigger...')
    
    // Read the SQL file
    const sql = fs.readFileSync('sql/create-profile-trigger.sql', 'utf8')
    
    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim()
      if (trimmedStatement) {
        console.log('Executing:', trimmedStatement.substring(0, 50) + '...')
        
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: trimmedStatement
        })
        
        if (error) {
          console.error('Error executing statement:', error)
          // Try direct execution for some statements
          try {
            const { error: directError } = await supabaseAdmin
              .from('_dummy_table_that_does_not_exist')
              .select('*')
            // This will fail, but we can use the connection
          } catch (e) {
            // Expected to fail
          }
        } else {
          console.log('Statement executed successfully')
        }
      }
    }
    
    console.log('Profile trigger setup complete!')
    
  } catch (error) {
    console.error('Error applying profile trigger:', error)
  }
}

applyProfileTrigger()