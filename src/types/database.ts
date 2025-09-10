// Simplified database types for deployment
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string | null;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string | null;
          user_id: string | null;
          role: string | null;
          joined_at: string | null;
        };
        Insert: {
          group_id?: string | null;
          user_id?: string | null;
          role?: string | null;
          joined_at?: string | null;
        };
        Update: {
          role?: string | null;
        };
      };
      group_messages: {
        Row: {
          id: string;
          group_id: string | null;
          sender_id: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          group_id?: string | null;
          sender_id?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          message?: string;
        };
      };
      ai_chats: {
        Row: {
          id: string;
          user_id: string | null;
          message: string;
          response: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          message: string;
          response?: string | null;
          created_at?: string;
        };
        Update: {
          response?: string | null;
        };
      };
      weeks: {
        Row: {
          id: string;
          week_number: number;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          week_number: number;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          updated_at?: string | null;
        };
      };
      week_files: {
        Row: {
          id: string;
          week_id: string | null;
          file_name: string;
          file_type: string;
          file_url: string;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          week_id?: string | null;
          file_name: string;
          file_type: string;
          file_url: string;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          file_name?: string;
          file_type?: string;
          file_url?: string;
          file_size?: number | null;
        };
      };
      schools: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
        };
      };
      admin_requests: {
        Row: {
          id: string;
          user_id: string | null;
          status: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          status?: string | null;
          updated_at?: string | null;
        };
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          position: string;
          bio: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          position: string;
          bio?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          position?: string;
          bio?: string | null;
          image_url?: string | null;
        };
      };
    };
  };
}

// Create more specific types for common use cases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type GroupMessage = Tables<'group_messages'>
export type Chat = Tables<'ai_chats'>
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
export type ApiResponse<T = unknown> = {
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