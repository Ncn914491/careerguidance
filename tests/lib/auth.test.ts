/**
 * Authentication and Admin Seeding Tests
 * 
 * Tests authentication utilities, admin user seeding, and authentication bypass
 * Requirements: 8.1, 8.2, 9.1, 9.4
 * 
 * @jest-environment jsdom
 */

// Mock environment variables
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

// Mock Supabase clients
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    getSession: jest.fn(),
    signOut: jest.fn(),
    admin: {
      createUser: jest.fn(),
      listUsers: jest.fn()
    }
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(),
    upsert: jest.fn()
  }))
}

const mockSupabaseAdminClient = {
  auth: {
    admin: {
      createUser: jest.fn(),
      listUsers: jest.fn()
    }
  },
  from: jest.fn(() => ({
    upsert: jest.fn(),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url, key) => {
    // Return different mocks based on the key type
    if (key === 'test-service-role-key') {
      return mockSupabaseAdminClient
    }
    return mockSupabaseClient
  })
}))

import { 
  isSeededAdmin, 
  ADMIN_CREDENTIALS, 
  seedAdminUser, 
  authenticateUser, 
  getCurrentUser,
  signOut,
  requireAdmin,
  createUserProfile
} from '../../src/lib/auth'

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isSeededAdmin', () => {
    it('should return true for seeded admin email', () => {
      expect(isSeededAdmin(ADMIN_CREDENTIALS.email)).toBe(true)
    })

    it('should return false for non-admin email', () => {
      expect(isSeededAdmin('user@example.com')).toBe(false)
    })

    it('should return false for empty email', () => {
      expect(isSeededAdmin('')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isSeededAdmin('NCHAITANYANAIDU@YAHOO.COM')).toBe(false)
      expect(isSeededAdmin('nchaitanyanaidu@YAHOO.COM')).toBe(false)
    })
  })

  describe('ADMIN_CREDENTIALS', () => {
    it('should have correct admin email', () => {
      expect(ADMIN_CREDENTIALS.email).toBe('nchaitanyanaidu@yahoo.com')
    })

    it('should have correct admin password', () => {
      expect(ADMIN_CREDENTIALS.password).toBe('adminncn@20')
    })

    it('should be immutable', () => {
      const originalEmail = ADMIN_CREDENTIALS.email
      const originalPassword = ADMIN_CREDENTIALS.password
      
      // Attempt to modify (should not work in TypeScript, but test anyway)
      try {
        (ADMIN_CREDENTIALS as any).email = 'hacked@example.com'
        (ADMIN_CREDENTIALS as any).password = 'hacked'
      } catch (error) {
        // Expected in strict mode
      }
      
      expect(ADMIN_CREDENTIALS.email).toBe(originalEmail)
      expect(ADMIN_CREDENTIALS.password).toBe(originalPassword)
    })
  })
})

describe('Admin User Seeding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('seedAdminUser', () => {
    it('should successfully create new admin user', async () => {
      const mockCreateUser = mockSupabaseAdminClient.auth.admin.createUser as jest.Mock
      const mockUpsert = mockSupabaseAdminClient.from().upsert as jest.Mock

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

      expect(mockUpsert).toHaveBeenCalledWith({
        id: mockAdminUser.id,
        email: ADMIN_CREDENTIALS.email,
        full_name: 'Chaitanya Naidu',
        role: 'admin'
      })

      expect(result.success).toBe(true)
      expect(result.userId).toBe(mockAdminUser.id)
    })

    it('should handle existing admin user gracefully', async () => {
      const mockCreateUser = mockSupabaseAdminClient.auth.admin.createUser as jest.Mock
      const mockListUsers = mockSupabaseAdminClient.auth.admin.listUsers as jest.Mock
      const mockUpsert = mockSupabaseAdminClient.from().upsert as jest.Mock

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

      expect(mockCreateUser).toHaveBeenCalled()
      expect(mockListUsers).toHaveBeenCalledWith({
        filter: `email.eq.${ADMIN_CREDENTIALS.email}`
      })
      expect(mockUpsert).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle auth creation errors', async () => {
      const mockCreateUser = mockSupabaseAdminClient.auth.admin.createUser as jest.Mock

      mockCreateUser.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const result = await seedAdminUser()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle profile creation errors', async () => {
      const mockCreateUser = mockSupabaseAdminClient.auth.admin.createUser as jest.Mock
      const mockUpsert = mockSupabaseAdminClient.from().upsert as jest.Mock

      mockCreateUser.mockResolvedValue({
        data: { user: { id: mockAdminUser.id, email: mockAdminUser.email } },
        error: null
      })

      mockUpsert.mockResolvedValue({
        data: null,
        error: { message: 'Profile creation failed' }
      })

      const result = await seedAdminUser()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

describe('Authentication Bypass Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticateUser', () => {
    it('should use bypass for seeded admin user', async () => {
      const mockSignIn = mockSupabaseClient.auth.signInWithPassword as jest.Mock

      mockSignIn.mockResolvedValue({
        data: { user: { id: mockAdminUser.id, email: mockAdminUser.email } },
        error: null
      })

      const result = await authenticateUser(
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      )

      expect(mockSignIn).toHaveBeenCalledWith({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password
      })

      expect(result.success).toBe(true)
      expect(result.isAdmin).toBe(true)
      expect(result.bypassUsed).toBe(true)
      expect(result.user?.email).toBe(ADMIN_CREDENTIALS.email)
    })

    it('should handle normal user authentication', async () => {
      const mockSignIn = mockSupabaseClient.auth.signInWithPassword as jest.Mock
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockSingle = mockEq().single as jest.Mock

      mockSignIn.mockResolvedValue({
        data: { user: { id: mockStudentUser.id, email: mockStudentUser.email } },
        error: null
      })

      mockSingle.mockResolvedValue({
        data: { role: 'student' },
        error: null
      })

      const result = await authenticateUser('student@example.com', 'password123')

      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'student@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(result.isAdmin).toBe(false)
      expect(result.bypassUsed).toBe(false)
    })

    it('should handle authentication failures', async () => {
      const mockSignIn = mockSupabaseClient.auth.signInWithPassword as jest.Mock

      mockSignIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      const result = await authenticateUser('wrong@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle profile fetch errors for normal users', async () => {
      const mockSignIn = mockSupabaseClient.auth.signInWithPassword as jest.Mock
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockSingle = mockEq().single as jest.Mock

      mockSignIn.mockResolvedValue({
        data: { user: { id: mockStudentUser.id, email: mockStudentUser.email } },
        error: null
      })

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      })

      const result = await authenticateUser('student@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getCurrentUser', () => {
    it('should identify seeded admin user', async () => {
      const mockGetSession = mockSupabaseClient.auth.getSession as jest.Mock

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

    it('should handle normal user sessions', async () => {
      const mockGetSession = mockSupabaseClient.auth.getSession as jest.Mock
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockSingle = mockEq().single as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: mockStudentUser.id, email: mockStudentUser.email } 
          } 
        },
        error: null
      })

      mockSingle.mockResolvedValue({
        data: { role: 'student' },
        error: null
      })

      const result = await getCurrentUser()

      expect(result.user?.email).toBe(mockStudentUser.email)
      expect(result.isAdmin).toBe(false)
      expect(result.isSeededAdmin).toBe(false)
    })

    it('should handle no session', async () => {
      const mockGetSession = mockSupabaseClient.auth.getSession as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await getCurrentUser()

      expect(result.user).toBeNull()
      expect(result.isAdmin).toBe(false)
    })
  })

  describe('requireAdmin', () => {
    it('should allow admin users', async () => {
      const mockGetSession = mockSupabaseClient.auth.getSession as jest.Mock

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

    it('should reject non-admin users', async () => {
      const mockGetSession = mockSupabaseClient.auth.getSession as jest.Mock
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockSingle = mockEq().single as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: mockStudentUser.id, email: mockStudentUser.email } 
          } 
        },
        error: null
      })

      mockSingle.mockResolvedValue({
        data: { role: 'student' },
        error: null
      })

      await expect(requireAdmin()).rejects.toThrow('Admin privileges required')
    })

    it('should reject unauthenticated users', async () => {
      const mockGetSession = mockSupabaseClient.auth.getSession as jest.Mock

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      await expect(requireAdmin()).rejects.toThrow('Authentication required')
    })
  })
})

describe('User Profile Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUserProfile', () => {
    it('should create user profile with default student role', async () => {
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockInsert = mockFrom().insert as jest.Mock

      mockInsert.mockResolvedValue({
        data: mockStudentUser,
        error: null
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

    it('should handle profile creation errors', async () => {
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockInsert = mockFrom().insert as jest.Mock

      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Profile creation failed' }
      })

      const result = await createUserProfile(
        mockStudentUser.id,
        mockStudentUser.email
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      const mockSignOut = mockSupabaseClient.auth.signOut as jest.Mock

      mockSignOut.mockResolvedValue({
        error: null
      })

      const result = await signOut()

      expect(mockSignOut).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle sign out errors', async () => {
      const mockSignOut = mockSupabaseClient.auth.signOut as jest.Mock

      mockSignOut.mockResolvedValue({
        error: { message: 'Sign out failed' }
      })

      const result = await signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})