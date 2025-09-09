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
          role: 'member' | 'admin'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'member' | 'admin'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'member' | 'admin'
          joined_at?: string
        }
      }
      weeks: {
        Row: {
          id: string
          week_number: number
          title: string
          description: string | null
          pdf_url: string | null
          photos: string[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          week_number: number
          title: string
          description?: string | null
          pdf_url?: string | null
          photos?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          week_number?: number
          title?: string
          description?: string | null
          pdf_url?: string | null
          photos?: string[] | null
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
      messages: {
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
      chats: {
        Row: {
          id: string
          group_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      admin_requests: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'approved' | 'denied'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'approved' | 'denied'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'denied'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      chats: {
        Row: {
          id: string
          group_id: string
          user_id: string
          message: string
          created_at: string
        }
      }
    }
    Functions: {
      ensure_profile_exists: {
        Args: {
          user_id: string
          user_email: string
          user_name: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}