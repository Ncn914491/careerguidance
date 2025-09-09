import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'career-guidance-auth'
  }
})

// Helper function to create a typed Supabase client
export function createTypedSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Re-export the Database type for convenience
export type { Database } from './database.types'