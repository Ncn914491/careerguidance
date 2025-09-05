import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'student' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          location: string | null
          visit_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          visit_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          visit_date?: string | null
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          name: string
          roll_number: string | null
          position: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          roll_number?: string | null
          position?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          roll_number?: string | null
          position?: string | null
          created_at?: string
        }
      }
      weeks: {
        Row: {
          id: string
          week_number: number
          title: string
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          week_number: number
          title: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          week_number?: number
          title?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      week_files: {
        Row: {
          id: string
          week_id: string
          file_name: string
          file_type: 'photo' | 'video' | 'pdf'
          file_url: string
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          week_id: string
          file_name: string
          file_type: 'photo' | 'video' | 'pdf'
          file_url: string
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          week_id?: string
          file_name?: string
          file_type?: 'photo' | 'video' | 'pdf'
          file_url?: string
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          sender_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
      }
      ai_chats: {
        Row: {
          id: string
          user_id: string
          message: string
          response: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          response: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          response?: string
          created_at?: string
          expires_at?: string
        }
      }
      admin_requests: {
        Row: {
          id: string
          user_id: string
          reason: string | null
          status: 'pending' | 'approved' | 'denied'
          reviewed_by: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          reason?: string | null
          status?: 'pending' | 'approved' | 'denied'
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          reason?: string | null
          status?: 'pending' | 'approved' | 'denied'
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }
    }
  }
}