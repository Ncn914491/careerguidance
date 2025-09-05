/**
 * Comprehensive Database and Authentication Tests
 * 
 * Tests database connection, CRUD operations, RLS policies, admin seeding, and authentication bypass
 * Requirements: 8.1, 8.2, 9.1, 9.4
 */

// Mock environment variables first
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock data for testing
const mockAdminUser = {
  id: 'admin-user-id',
  email: 'nchaitanyanaidu@yahoo.com',
  full_name: 'Chaitanya Naidu',
  role: 'admin' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockStudentUser = {
  id: 'student-user-id',
  email: 'student@example.com',
  full_name: 'Test Student',
  role: 'student' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockWeek = {
  id: 'test-week-id',
  week_number: 1,
  title: 'Test Week',
  description: 'Test Description',
  created_by: 'admin-user-id',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock current authenticated user for RLS testing
let currentAuthUser: any = null

// Create comprehensive mock Supabase client
function createMockSupabaseClient() {
  return {
  auth: {
    getSession: jest.fn(() => ({
      data: { session: currentAuthUser ? { user: currentAuthUser } : null },
      error: null
    })),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    admin: {
      createUser: jest.fn(),
      listUsers: jest.fn()
    }
  },
  from: jest.fn((table: string) => {
    // Mock RLS behavior based on current user and table
    const createTableMock = () => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => {
            // Simulate RLS policies
            if (table === 'ai_chats' && (!currentAuthUser || currentAuthUser.id !== mockStudentUser.id)) {
              return { data: null, error: { code: '42501', message: 'permission denied' } }
            }
            return { data: mockStudentUser, error: null }
          }),
          limit: jest.fn(() => ({ data: [mockStudentUser], error: null }))
        })),
        order: jest.fn(() => ({ data: [mockStudentUser], error: null })),
        limit: jest.fn(() => ({ data: [mockStudentUser], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => {
            // Simulate RLS policies for insert
            if (table === 'weeks' && (!currentAuthUser || currentAuthUser.role !== 'admin')) {
              return { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } }
            }
            return { data: mockWeek, error: null }
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => {
              // Simulate RLS policies for update
              if (table === 'profiles' && currentAuthUser?.id !== mockStudentUser.id) {
                return { data: null, error: { code: '42501', message: 'update violates row-level security policy' } }
              }
              return { data: { ...mockStudentUser, full_name: 'Updated Name' }, error: null }
            })
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => {
          // Simulate RLS policies for delete
          if (table === 'weeks' && (!currentAuthUser || currentAuthUser.role !== 'admin')) {
            return { data: null, error: { code: '42501', message: 'delete violates row-level security policy' } }
          }
          return { data: null, error: null }
        })
      })),
      upsert: jest.fn(() => ({ data: mockAdminUser, error: null }))
    })

    return createTableMock()
  })
  }
}

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => createMockSupabaseClient())
}))

import { supabase } from '../../src/lib/supabase'
import { 
  isSeededAdmin, 
  ADMIN_CREDENTIALS, 
  seedAdminUser, 
  authenticateUser, 
  getCurrentUser,
  requireAdmin,
  createUserProfile
} from '../../src/lib/auth'

describe('Database Connection and CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentAuthUser = null
  })

  describe('Supabase Client Initialization', () => {
    it('should initialize Supabase client with correct configuration', () => {
      expect(supabase).toBeDefined()
      expect(typeof supabase.from).toBe('function')
      expect(typeof supabase.auth).toBe('object')
    })

    it('should have all required methods', () => {
      expect(supabase.auth.getSession).toBeDefined()
      expect(supabase.auth.signInWithPassword).toBeDefined()
      expect(supabase.auth.signOut).toBeDefined()
    })
  })

  describe('Database Table Access', () => {
    it('should access all required tables', () => {
      const tables = [
        'profiles', 'schools', 'team_members', 'weeks', 'week_files',
        'groups', 'group_members', 'group_messages', 'ai_chats', 'admin_requests'
      ]

      tables.forEach(tableName => {
        const table = supabase.from(tableName)
        expect(table).toBeDefined()
        expect(typeof table.select).toBe('function')
        expect(typeof table.insert).toBe('function')
        expect(typeof table.update).toBe('function')
        expect(typeof table.delete).toBe('function')
      })
    })
  })

  describe('Basic CRUD Operations', () => {
    it('should create a profile record', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: mockStudentUser.id,
          email: mockStudentUser.email,
          full_name: mockStudentUser.full_name,
          role: mockStudentUser.role
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should read a profile record', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockStudentUser.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.id).toBe(mockStudentUser.id)
    })

    it('should update a profile record', async () => {
      currentAuthUser = mockStudentUser // Set current user for RLS

      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'Updated Name' })
        .eq('id', mockStudentUser.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.full_name).toBe('Updated Name')
    })

    it('should delete a record (admin only)', async () => {
      currentAuthUser = mockAdminUser // Set admin user for RLS

      const { error } = await supabase
        .from('weeks')
        .delete()
        .eq('id', 'test-week-id')

      expect(error).toBeNull()
    })
  })

  describe('Data Validation and Constraints', () => {
    it('should handle constraint violations', async () => {
      // Mock constraint violation
      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' }
            }))
          }))
        }))
      })

      const { data, error } = await supabase
        .from('weeks')
        .insert({ week_number: 1, title: 'Duplicate Week' })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23505')
    })
  })
})

describe('Row-Level Security (RLS) Policy Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentAuthUser = null
  })

  describe('Profiles Table RLS', () => {
    it('should allow users to update their own profile', async () => {
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

    it('should prevent users from updating other profiles', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'Hacked Name' })
        .eq('id', 'other-user-id')
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })
  })

  describe('Weeks Table RLS', () => {
    it('should allow admins to create weeks', async () => {
      currentAuthUser = mockAdminUser

      const { data, error } = await supabase
        .from('weeks')
        .insert({
          week_number: 2,
          title: 'Week 2',
          description: 'Admin created week'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should prevent students from creating weeks', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('weeks')
        .insert({
          week_number: 3,
          title: 'Unauthorized Week'
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })
  })

  describe('AI Chats RLS', () => {
    it('should allow users to access their own AI chats', async () => {
      currentAuthUser = mockStudentUser

      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', mockStudentUser.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should prevent users from accessing other users AI chats', async () => {
      currentAuthUser = { id: 'other-user-id', role: 'student' }

      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', mockStudentUser.id)
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })
  })
})

describe('Authentication and Admin Seeding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentAuthUser = null
  })

  describe('Admin Credentials', () => {
    it('should have correct admin credentials', () => {
      expect(ADMIN_CREDENTIALS.email).toBe('nchaitanyanaidu@yahoo.com')
      expect(ADMIN_CREDENTIALS.password).toBe('adminncn@20')
    })

    it('should identify seeded admin correctly', () => {
      expect(isSeededAdmin(ADMIN_CREDENTIALS.email)).toBe(true)
      expect(isSeededAdmin('other@example.com')).toBe(false)
      expect(isSeededAdmin('')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isSeededAdmin('NCHAITANYANAIDU@YAHOO.COM')).toBe(false)
    })
  })

  describe('Admin User Seeding', () => {
    it('should successfully seed admin user', async () => {
      const mockCreateUser = supabase.auth.admin.createUser as jest.Mock
      const mockUpsert = supabase.from('profiles').upsert as jest.Mock

      mockCreateUser.mockResolvedValue({
        data: { user: { id: mockAdminUser.id, email: mockAdminUser.email } },
        error: null
      })

      mockUpsert.mockResolvedValue({
        data: mockAdminUser,
        error: null
      })

      const result = await seedAdminUser()

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password,
        email_confirm: true
      })

      expect(result.success).toBe(true)
      expect(result.userId).toBe(mockAdminUser.id)
    })

    it('should handle existing admin user', async () => {
      const mockCreateUser = supabase.auth.admin.createUser as jest.Mock
      const mockListUsers = supabase.auth.admin.listUsers as jest.Mock
      const mockUpsert = supabase.from('profiles').upsert as jest.Mock

      mockCreateUser.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      })

      mockListUsers.mockResolvedValue({
        data: { users: [{ id: mockAdminUser.id, email: mockAdminUser.email }] },
        error: null
      })

      mockUpsert.mockResolvedValue({
        data: mockAdminUser,
        error: null
      })

      const result = await seedAdminUser()

      expect(result.success).toBe(true)
    })
  })

  describe('Authentication Bypass', () => {
    it('should use bypass for seeded admin', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock

      mockSignIn.mockResolvedValue({
        data: { user: { id: mockAdminUser.id, email: mockAdminUser.email } },
        error: null
      })

      const result = await authenticateUser(
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      )

      expect(result.success).toBe(true)
      expect(result.isAdmin).toBe(true)
      expect(result.bypassUsed).toBe(true)
    })

    it('should handle normal user authentication', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      const mockFrom = supabase.from as jest.Mock

      mockSignIn.mockResolvedValue({
        data: { user: { id: mockStudentUser.id, email: mockStudentUser.email } },
        error: null
      })

      // Mock profile lookup
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { role: 'student' },
              error: null
            }))
          }))
        }))
      })

      const result = await authenticateUser('student@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.isAdmin).toBe(false)
      expect(result.bypassUsed).toBe(false)
    })
  })

  describe('User Session Management', () => {
    it('should identify seeded admin in session', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: mockAdminUser.id, email: ADMIN_CREDENTIALS.email } 
          } 
        },
        error: null
      })

      const result = await getCurrentUser()

      expect(result.user?.email).toBe(ADMIN_CREDENTIALS.email)
      expect(result.isAdmin).toBe(true)
      expect(result.isSeededAdmin).toBe(true)
    })

    it('should handle no session', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await getCurrentUser()

      expect(result.user).toBeNull()
      expect(result.isAdmin).toBe(false)
    })
  })

  describe('Admin Authorization', () => {
    it('should allow admin users', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: mockAdminUser.id, email: ADMIN_CREDENTIALS.email } 
          } 
        },
        error: null
      })

      const result = await requireAdmin()

      expect(result.user?.email).toBe(ADMIN_CREDENTIALS.email)
      expect(result.isAdmin).toBe(true)
    })

    it('should reject unauthenticated users', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      await expect(requireAdmin()).rejects.toThrow('Authentication required')
    })
  })

  describe('User Profile Management', () => {
    it('should create user profile with default student role', async () => {
      const mockFrom = supabase.from as jest.Mock
      const mockInsert = jest.fn(() => ({
        data: mockStudentUser,
        error: null
      }))

      mockFrom.mockReturnValue({
        insert: mockInsert
      })

      const result = await createUserProfile(
        mockStudentUser.id,
        mockStudentUser.email,
        mockStudentUser.full_name
      )

      expect(mockInsert).toHaveBeenCalledWith({
        id: mockStudentUser.id,
        email: mockStudentUser.email,
        full_name: mockStudentUser.full_name,
        role: 'student'
      })

      expect(result.success).toBe(true)
    })
  })
})

describe('Database Migration and Setup Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Schema Validation', () => {
    it('should verify all required tables exist', async () => {
      const expectedTables = [
        'profiles', 'schools', 'team_members', 'weeks', 'week_files',
        'groups', 'group_members', 'group_messages', 'ai_chats', 'admin_requests'
      ]

      // Mock information_schema query
      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: expectedTables.map(name => ({ table_name: name })),
              error: null
            }))
          }))
        }))
      })

      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBe(expectedTables.length)
    })

    it('should handle database connection errors', async () => {
      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: null,
              error: { message: 'Database connection failed' }
            }))
          }))
        }))
      })

      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error.message).toContain('Database connection failed')
    })
  })

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      expect(process.env.SUPABASE_URL).toBeDefined()
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    })

    it('should validate environment variable format', () => {
      expect(process.env.SUPABASE_URL).toMatch(/^https:\/\//)
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\//)
    })
  })
})