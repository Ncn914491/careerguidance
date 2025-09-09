import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

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
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'student' // Default role for new users
      } as any)

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
