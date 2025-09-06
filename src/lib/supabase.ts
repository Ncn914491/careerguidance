import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'career-guidance-auth'
      }
    })
  }
  return supabaseInstance
})()

// Re-export the Database type for convenience
export type { Database } from './database.types'

// Legacy type definitions (keeping for backward compatibility)
export type LegacyDatabase = {
  // This is kept for backward compatibility but should use Database from database.types.ts
}