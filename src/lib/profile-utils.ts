import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Ensure a user profile exists in the profiles table
 * This is called after signup or login to make sure the profile is created
 */
export async function ensureProfileExists(user: User) {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Profile already exists
      return { success: true, existed: true };
    }

    // Create profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'student'
      });

    if (error) {
      console.error('Error creating profile:', error);
      
      // Try using the database function as fallback
      const { error: functionError } = await supabase.rpc('ensure_profile_exists', {
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || null
      });

      if (functionError) {
        console.error('Error with fallback profile creation:', functionError);
        return { success: false, error: functionError };
      }
    }

    return { success: true, existed: false };
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return { success: false, error };
  }
}

/**
 * Add user to default groups after profile creation
 */
export async function addUserToDefaultGroups(userId: string) {
  try {
    // Get default groups
    const { data: defaultGroups } = await supabase
      .from('groups')
      .select('id')
      .in('name', ['General Discussion', 'Study Group', 'Career Guidance']);

    if (!defaultGroups || defaultGroups.length === 0) {
      console.log('No default groups found');
      return { success: true };
    }

    // Add user to each default group
    const memberships = defaultGroups.map(group => ({
      group_id: group.id,
      user_id: userId
    }));

    const { error } = await supabase
      .from('group_members')
      .insert(memberships);

    if (error) {
      console.error('Error adding user to default groups:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding user to default groups:', error);
    return { success: false, error };
  }
}

/**
 * Get user profile with role information
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: {
  full_name?: string;
  role?: 'student' | 'admin';
}) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}