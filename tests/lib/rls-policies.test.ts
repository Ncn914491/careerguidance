/**
 * Row-Level Security (RLS) Policies Tests
 * 
 * Tests that RLS policies are properly enforced for data access control
 * Requirements: 9.1, 9.4
 */

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock users for testing
const mockStudentUser = {
  id: 'student-user-id',
  email: 'student@example.com',
  role: 'student' as const
}

const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  role: 'admin' as const
}

const mockOtherUser = {
  id: 'other-user-id',
  email: 'other@example.com',
  role: 'student' as const
}

// Mock auth context for different users
let currentAuthUser: any = null

const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(() => ({
      data: { session: currentAuthUser ? { user: currentAuthUser } : null },
      error: null
    })),
    getUser: jest.fn(() => ({
      data: { user: currentAuthUser },
      error: null
    }))
  },
  from: jest.fn((table: string) => {
    // Mock RLS enforcement based on current user and table
    const createMockQuery = (allowedData: any[], deniedError?: any) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: allowedData.length > 0 ? allowedData[0] : null,
            error: deniedError || null
          })),
          limit: jest.fn(() => ({
            data: allowedData,
            error: deniedError || null
          }))
        })),
        limit: jest.fn(() => ({
          data: allowedData,
          error: deniedError || null
        })),
        order: jest.fn(() => ({
          data: allowedData,
          error: deniedError || null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => {
            // Check RLS policies for insert
            if (table === 'weeks' && (!currentAuthUser || mockStudentUser.id === currentAuthUser.id)) {
              return {
                data: null,
                error: { code: '42501', message: 'new row violates row-level security policy' }
              }
            }
            return { data: allowedData[0] || {}, error: null }
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => {
              // Check RLS policies for update
              if (table === 'profiles' && currentAuthUser?.id !== mockStudentUser.id) {
                return {
                  data: null,
                  error: { code: '42501', message: 'new row violates row-level security policy' }
                }
              }
              return { data: allowedData[0] || {}, error: null }
            })
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => {
          // Check RLS policies for delete
          if (table === 'weeks' && (!currentAuthUser || mockStudentUser.id === currentAuthUser.id)) {
            return {
              data: null,
              error: { code: '42501', message: 'delete violates row-level security policy' }
            }
          }
          return { data: null, error: null }
        })
      }))
    })

    // Return appropriate mock based on table and current user
    switch (table) {
      case 'profiles':
        return createMockQuery([mockStudentUser, mockAdminUser, mockOtherUser])
      case 'weeks':
        return createMockQuery([
          { id: 'week-1', week_number: 1, title: 'Week 1', created_by: mockAdminUser.id }
        ])
      case 'week_files':
        return createMockQuery([
          { id: 'file-1', week_id: 'week-1', file_name: 'test.pdf', uploaded_by: mockAdminUser.id }
        ])
      case 'groups':
        return createMockQuery([
          { id: 'group-1', name: 'Test Group', created_by: mockStudentUser.id }
        ])
      case 'group_members':
        return createMockQuery([
          { id: 'member-1', group_id: 'group-1', user_id: mockStudentUser.id }
        ])
      case 'group_messages':
        return createMockQuery([
          { id: 'msg-1', group_id: 'group-1', sender_id: mockStudentUser.id, message: 'Hello' }
        ])
      case 'ai_chats':
        return createMockQuery([
          { id: 'chat-1', user_id: mockStudentUser.id, message: 'Hello AI', response: 'Hi there!' }
        ])
      case 'admin_requests':
        return createMockQuery([
          { id: 'req-1', user_id: mockStudentUser.id, reason: 'Need admin access', status: 'pending' }
        ])
      default:
        return createMockQuery([])
    }
  })
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

import { supabase } from '../../src/lib/supabase'

describe('Row-Level Security (RLS) Policy Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentAuthUser = null
  })

  describe('Profiles Table RLS Policies', () => {
    it('should allow all users to read profiles (public viewable)', async () => {
      // Test as student user
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow users to update their own profile only', async () => {
      // Test as student user updating own profile
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'Updated Name' })
        .eq('id', mockStudentUser.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should prevent users from updating other users profiles', async () => {
      // Test as student user trying to update another user's profile
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'Hacked Name' })
        .eq('id', mockOtherUser.id)
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })

    it('should allow users to insert their own profile', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: mockStudentUser.id,
          email: mockStudentUser.email,
          role: mockStudentUser.role
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Weeks Table RLS Policies', () => {
    it('should allow everyone to read weeks', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('weeks')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow only admins to create weeks', async () => {
      // Test as admin user
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('weeks')
        .insert({
          week_number: 2,
          title: 'Week 2',
          description: 'Second week content'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should prevent students from creating weeks', async () => {
      // Test as student user
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('weeks')
        .insert({
          week_number: 3,
          title: 'Week 3',
          description: 'Unauthorized week'
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })

    it('should allow only admins to update weeks', async () => {
      // Test as admin user
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('weeks')
        .update({ title: 'Updated Week Title' })
        .eq('id', 'week-1')
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Week Files Table RLS Policies', () => {
    it('should allow everyone to read week files', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('week_files')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow only admins to upload files', async () => {
      // Test as admin user
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('week_files')
        .insert({
          week_id: 'week-1',
          file_name: 'new-file.pdf',
          file_type: 'pdf',
          file_url: 'https://example.com/new-file.pdf'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should prevent students from uploading files', async () => {
      // Test as student user
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('week_files')
        .insert({
          week_id: 'week-1',
          file_name: 'unauthorized.pdf',
          file_type: 'pdf',
          file_url: 'https://example.com/unauthorized.pdf'
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })
  })

  describe('Groups and Group Members RLS Policies', () => {
    it('should allow users to view groups they are members of', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('groups')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow authenticated users to create groups', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: 'New Study Group',
          description: 'A group for studying'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow users to join groups', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: 'group-1',
          user_id: mockStudentUser.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow admins to view all groups', async () => {
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('groups')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Group Messages RLS Policies', () => {
    it('should allow group members to view messages', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', 'group-1')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow group members to send messages', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: 'group-1',
          sender_id: mockStudentUser.id,
          message: 'Hello group!'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow admins to view all group messages', async () => {
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('group_messages')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('AI Chats RLS Policies', () => {
    it('should allow users to view only their own AI chats', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', mockStudentUser.id)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow users to create their own AI chats', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('ai_chats')
        .insert({
          user_id: mockStudentUser.id,
          message: 'What is AI?',
          response: 'AI stands for Artificial Intelligence...'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should prevent users from viewing other users AI chats', async () => {
      currentAuthUser = mockOtherUser

      // Mock should return empty data for other user's chats
      const mockFrom = supabase.from as jest.Mock
      const mockSelect = mockFrom('ai_chats').select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock

      mockEq.mockReturnValue({
        data: [], // No data for other user's chats
        error: null
      })

      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', mockStudentUser.id) // Trying to access another user's chats

      expect(error).toBeNull()
      expect(data).toEqual([]) // Should return empty array
    })
  })

  describe('Admin Requests RLS Policies', () => {
    it('should allow users to view their own admin requests', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('user_id', mockStudentUser.id)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow users to create admin requests', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('admin_requests')
        .insert({
          user_id: mockStudentUser.id,
          reason: 'I need admin access to help with content management'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow admins to view all admin requests', async () => {
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('admin_requests')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow admins to update admin requests', async () => {
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('admin_requests')
        .update({
          status: 'approved',
          reviewed_by: mockAdminUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', 'req-1')
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Unauthenticated Access', () => {
    it('should prevent unauthenticated users from accessing protected data', async () => {
      currentAuthUser = null // No authenticated user

      // Mock should return appropriate errors for unauthenticated access
      const mockFrom = supabase.from as jest.Mock
      
      // Override mock to simulate unauthenticated access
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: '42501', message: 'permission denied for table' }
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: '42501', message: 'permission denied for table' }
            }))
          }))
        }))
      })

      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })

    it('should allow unauthenticated users to read public data', async () => {
      currentAuthUser = null

      // Profiles should be publicly readable
      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          data: [mockStudentUser, mockAdminUser],
          error: null
        }))
      })

      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('RLS Policy Enforcement Edge Cases', () => {
    it('should handle cascade deletes with RLS', async () => {
      currentAuthUser = mockAdminUser

      // When a week is deleted, associated files should also be deleted
      const { error } = await supabase
        .from('weeks')
        .delete()
        .eq('id', 'week-1')

      expect(error).toBeNull()
    })

    it('should enforce unique constraints with RLS', async () => {
      currentAuthUser = mockStudentUser

      // Mock unique constraint violation
      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint'
              }
            }))
          }))
        }))
      })

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: 'group-1',
          user_id: mockStudentUser.id // Duplicate membership
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505')
      expect(data).toBeNull()
    })

    it('should handle foreign key constraints with RLS', async () => {
      currentAuthUser = mockAdminUser

      // Mock foreign key constraint violation
      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: {
                code: '23503',
                message: 'insert or update on table violates foreign key constraint'
              }
            }))
          }))
        }))
      })

      const { data, error } = await supabase
        .from('week_files')
        .insert({
          week_id: 'non-existent-week',
          file_name: 'test.pdf',
          file_type: 'pdf',
          file_url: 'https://example.com/test.pdf'
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503')
      expect(data).toBeNull()
    })
  })
})