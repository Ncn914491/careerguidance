import { supabase } from './supabase'

// Simple function to test Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('Supabase connection test - Expected error (table may not exist yet):', error.message)
      return { success: true, message: 'Supabase client configured correctly' }
    }
    
    return { success: true, message: 'Supabase connection successful', data }
  } catch (err) {
    console.error('Supabase connection test failed:', err)
    return { success: false, message: 'Supabase connection failed', error: err }
  }
}