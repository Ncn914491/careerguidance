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
      console.warn('Default group "General Discussion" not found, skipping auto-join')
      // Don't fail - just skip adding to default group
      return { success: true, message: 'No default group found' }
    }

    // Add user to the default group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: membershipError } = await (supabase as any)
      .from('group_members')
      .insert({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        group_id: (defaultGroup as any).id,
        user_id: userId,
        role: 'member' // Assuming a default role for new members
      })

    if (membershipError) {
      console.error('Error adding user to default group:', membershipError)
      // Don't fail signup for this - user can join groups manually
      return { success: true, message: 'Could not auto-join default group' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addUserToDefaultGroups:', error)
    return { success: true, message: 'Could not auto-join default group' }
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