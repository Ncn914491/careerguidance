import { supabase } from './supabase'

/**
 * Add a user to default groups when they sign up
 */
export async function addUserToDefaultGroups(userId: string) {
  try {
    // Get the "General Discussion" group (default group for all users)
    const { data: defaultGroup, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('name', 'General Discussion')
      .single()

    if (groupError || !defaultGroup) {
      console.error('Default group not found:', groupError)
      return { success: false, error: 'Default group not found' }
    }

    // Add user to the default group
    const { error: membershipError } = await supabase
      .from('group_members')
      .insert({
        group_id: defaultGroup.id,
        user_id: userId
      })

    if (membershipError) {
      console.error('Error adding user to default group:', membershipError)
      return { success: false, error: membershipError }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addUserToDefaultGroups:', error)
    return { success: false, error }
  }
}

/**
 * Get available groups that a user can join
 */
export async function getAvailableGroups(userId: string) {
  try {
    // Get all groups that the user is not already a member of
    const { data: availableGroups, error } = await supabase
      .from('groups')
      .select('*')
      .not('id', 'in', `(
        SELECT group_id FROM group_members WHERE user_id = '${userId}'
      )`)

    if (error) {
      console.error('Error fetching available groups:', error)
      return { success: false, error }
    }

    return { success: true, groups: availableGroups || [] }
  } catch (error) {
    console.error('Error in getAvailableGroups:', error)
    return { success: false, error }
  }
}