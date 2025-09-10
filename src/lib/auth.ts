import { supabaseAdmin } from './supabase-admin'
import type { Database } from './database.types'

// Admin user credentials for seeding and bypass
export const ADMIN_CREDENTIALS = {
  email: 'nchaitanyanaidu@yahoo.com',
  password: 'adminncn@20'
}

/**
 * Create a new user profile after signup
 */
export async function createUserProfile(userId: string, email: string, fullName?: string) {
  try {
    const profileData: Database['public']['Tables']['profiles']['Insert'] = {
      id: userId,
      email,
      full_name: fullName,
      role: 'student' // Default role for new users
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
      .from('profiles')
      .insert(profileData)

    if (error) {
      console.error('Error creating user profile:', error)
      return { success: false, error }
    }

    // Add user to default groups
    const { addUserToDefaultGroups } = await import('./groups')
    await addUserToDefaultGroups(userId)

    return { success: true }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error }
  }
}
