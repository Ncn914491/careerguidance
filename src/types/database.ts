// Updated database types that match the actual Supabase schema
import { Database as GeneratedDatabase } from './supabase'

// Re-export the generated database type as the main Database type
export type Database = GeneratedDatabase

// Create more specific types for common use cases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type GroupMessage = Tables<'group_messages'>
export type Chat = Tables<'chats'>
export type Week = Tables<'weeks'>
export type WeekFile = Tables<'week_files'>
export type School = Tables<'schools'>
export type AdminRequest = Tables<'admin_requests'>

// Enhanced types with relationships
export type ProfileWithRole = Profile & {
  role: 'student' | 'admin' // More specific than string | null
}

export type GroupWithMembers = Group & {
  group_members: (GroupMember & {
    profiles: Pick<Profile, 'full_name' | 'email'>
  })[]
}

export type GroupMessageWithProfile = GroupMessage & {
  profiles: Pick<Profile, 'full_name' | 'email'> | null
}

export type WeekWithFiles = Week & {
  week_files: WeekFile[]
}

// Message type for compatibility (maps to group_messages)
export type Message = GroupMessageWithProfile

// Role types
export type UserRole = 'student' | 'admin'
export type GroupMemberRole = 'member' | 'admin'

// API response types
export type ApiResponse<T = any> = {
  data?: T
  error?: string
  status?: number
}

// Common query filters
export type ProfileFilter = {
  role?: UserRole
  email?: string
}

export type GroupFilter = {
  created_by?: string
  name?: string
}

export type MessageFilter = {
  group_id?: string
  sender_id?: string
}