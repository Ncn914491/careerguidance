// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'student' | 'admin' | 'pending_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'student' | 'admin' | 'pending_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'student' | 'admin' | 'pending_admin'
          created_at?: string
          updated_at?: string
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
    }
  }
}