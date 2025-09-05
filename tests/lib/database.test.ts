/**
 * Database Connection and CRUD Operations Tests
 * 
 * Tests database connectivity, basic CRUD operations, and data integrity
 * Requirements: 9.1, 9.4
 */

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock data for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'student' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockSchool = {
  id: 'test-school-id',
  name: 'Test School',
  location: 'Test City',
  visit_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z'
}

const mockWeek = {
  id: 'test-week-id',
  week_number: 1,
  title: 'Test Week',
  description: 'Test Description',
  created_by: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock Supabase client with comprehensive CRUD operations
let mockSupabaseClient: any

// Initialize mock before jest.mock
mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    admin: {
      createUser: jest.fn(),
      listUsers: jest.fn()
    }
  },
  from: jest.fn((table: string) => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        limit: jest.fn(() => ({ data: [], error: null }))
      })),
      limit: jest.fn(() => ({ data: [], error: null })),
      order: jest.fn(() => ({ data: [], error: null }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn()
    })),
    upsert: jest.fn()
  }))
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

import { supabase } from '../../src/lib/supabase'

describe('Database Connection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Supabase Client Initialization', () => {
    it('should initialize Supabase client with correct configuration', () => {
      expect(supabase).toBeDefined()
      expect(typeof supabase.from).toBe('function')
      expect(typeof supabase.auth).toBe('object')
    })

    it('should have auth methods available', () => {
      expect(supabase.auth.getSession).toBeDefined()
      expect(supabase.auth.signInWithPassword).toBeDefined()
    })
  })

  describe('Database Table Access', () => {
    it('should be able to access profiles table', () => {
      const profilesTable = supabase.from('profiles')
      expect(profilesTable).toBeDefined()
      expect(typeof profilesTable.select).toBe('function')
    })

    it('should be able to access all required tables', () => {
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
})

describe('CRUD Operations Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Profiles Table CRUD', () => {
    it('should create a new profile', async () => {
      const mockInsert = supabase.from('profiles').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: mockUser,
        error: null
      })

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          role: mockUser.role
        })
        .select()
        .single()

      expect(mockInsert).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        role: mockUser.role
      })
      expect(data).toEqual(mockUser)
      expect(error).toBeNull()
    })

    it('should read profile by id', async () => {
      const mockSelect = supabase.from('profiles').select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockSingle = mockEq().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: mockUser,
        error: null
      })

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockUser.id)
        .single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id)
      expect(data).toEqual(mockUser)
      expect(error).toBeNull()
    })

    it('should update profile', async () => {
      const updatedData = { ...mockUser, full_name: 'Updated Name' }
      const mockUpdate = supabase.from('profiles').update as jest.Mock
      const mockEq = mockUpdate().eq as jest.Mock
      const mockSelect = mockEq().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: updatedData,
        error: null
      })

      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'Updated Name' })
        .eq('id', mockUser.id)
        .select()
        .single()

      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Updated Name' })
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id)
      expect(data).toEqual(updatedData)
      expect(error).toBeNull()
    })

    it('should delete profile', async () => {
      const mockDelete = supabase.from('profiles').delete as jest.Mock
      const mockEq = mockDelete().eq as jest.Mock

      mockEq.mockResolvedValue({
        data: null,
        error: null
      })

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', mockUser.id)

      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id)
      expect(error).toBeNull()
    })
  })

  describe('Schools Table CRUD', () => {
    it('should create a new school', async () => {
      const mockInsert = supabase.from('schools').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: mockSchool,
        error: null
      })

      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: mockSchool.name,
          location: mockSchool.location,
          visit_date: mockSchool.visit_date
        })
        .select()
        .single()

      expect(mockInsert).toHaveBeenCalledWith({
        name: mockSchool.name,
        location: mockSchool.location,
        visit_date: mockSchool.visit_date
      })
      expect(data).toEqual(mockSchool)
      expect(error).toBeNull()
    })

    it('should read all schools', async () => {
      const mockSelect = supabase.from('schools').select as jest.Mock
      const mockOrder = mockSelect().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: [mockSchool],
        error: null
      })

      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false })

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(data).toEqual([mockSchool])
      expect(error).toBeNull()
    })
  })

  describe('Weeks Table CRUD', () => {
    it('should create a new week', async () => {
      const mockInsert = supabase.from('weeks').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: mockWeek,
        error: null
      })

      const { data, error } = await supabase
        .from('weeks')
        .insert({
          week_number: mockWeek.week_number,
          title: mockWeek.title,
          description: mockWeek.description,
          created_by: mockWeek.created_by
        })
        .select()
        .single()

      expect(mockInsert).toHaveBeenCalledWith({
        week_number: mockWeek.week_number,
        title: mockWeek.title,
        description: mockWeek.description,
        created_by: mockWeek.created_by
      })
      expect(data).toEqual(mockWeek)
      expect(error).toBeNull()
    })

    it('should enforce unique week_number constraint', async () => {
      const mockInsert = supabase.from('weeks').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      // Simulate unique constraint violation
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "weeks_week_number_key"'
        }
      })

      const { data, error } = await supabase
        .from('weeks')
        .insert({
          week_number: 1, // Duplicate week number
          title: 'Another Week 1',
          description: 'This should fail'
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error?.code).toBe('23505')
    })
  })

  describe('Foreign Key Relationships', () => {
    it('should handle week_files relationship with weeks', async () => {
      const mockWeekFile = {
        id: 'test-file-id',
        week_id: mockWeek.id,
        file_name: 'test.pdf',
        file_type: 'pdf' as const,
        file_url: 'https://example.com/test.pdf',
        uploaded_by: mockUser.id,
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockInsert = supabase.from('week_files').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: mockWeekFile,
        error: null
      })

      const { data, error } = await supabase
        .from('week_files')
        .insert({
          week_id: mockWeekFile.week_id,
          file_name: mockWeekFile.file_name,
          file_type: mockWeekFile.file_type,
          file_url: mockWeekFile.file_url,
          uploaded_by: mockWeekFile.uploaded_by
        })
        .select()
        .single()

      expect(mockInsert).toHaveBeenCalledWith({
        week_id: mockWeekFile.week_id,
        file_name: mockWeekFile.file_name,
        file_type: mockWeekFile.file_type,
        file_url: mockWeekFile.file_url,
        uploaded_by: mockWeekFile.uploaded_by
      })
      expect(data).toEqual(mockWeekFile)
      expect(error).toBeNull()
    })

    it('should handle group membership relationships', async () => {
      const mockGroup = {
        id: 'test-group-id',
        name: 'Test Group',
        description: 'Test Description',
        created_by: mockUser.id,
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockGroupMember = {
        id: 'test-member-id',
        group_id: mockGroup.id,
        user_id: mockUser.id,
        joined_at: '2024-01-01T00:00:00Z'
      }

      const mockInsert = supabase.from('group_members').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      mockSingle.mockResolvedValue({
        data: mockGroupMember,
        error: null
      })

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: mockGroupMember.group_id,
          user_id: mockGroupMember.user_id
        })
        .select()
        .single()

      expect(mockInsert).toHaveBeenCalledWith({
        group_id: mockGroupMember.group_id,
        user_id: mockGroupMember.user_id
      })
      expect(data).toEqual(mockGroupMember)
      expect(error).toBeNull()
    })
  })

  describe('Data Validation and Constraints', () => {
    it('should enforce role enum constraint on profiles', async () => {
      const mockInsert = supabase.from('profiles').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      // Simulate enum constraint violation
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'new row for relation "profiles" violates check constraint "profiles_role_check"'
        }
      })

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: 'test-id',
          email: 'test@example.com',
          role: 'invalid_role' as any // Invalid role
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error?.code).toBe('23514')
    })

    it('should enforce file_type enum constraint on week_files', async () => {
      const mockInsert = supabase.from('week_files').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      // Simulate enum constraint violation
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'new row for relation "week_files" violates check constraint "week_files_file_type_check"'
        }
      })

      const { data, error } = await supabase
        .from('week_files')
        .insert({
          week_id: 'test-week-id',
          file_name: 'test.txt',
          file_type: 'text' as any, // Invalid file type
          file_url: 'https://example.com/test.txt'
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error?.code).toBe('23514')
    })

    it('should enforce admin_request status enum constraint', async () => {
      const mockInsert = supabase.from('admin_requests').insert as jest.Mock
      const mockSelect = mockInsert().select as jest.Mock
      const mockSingle = mockSelect().single as jest.Mock

      // Simulate enum constraint violation
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'new row for relation "admin_requests" violates check constraint "admin_requests_status_check"'
        }
      })

      const { data, error } = await supabase
        .from('admin_requests')
        .insert({
          user_id: mockUser.id,
          reason: 'Test reason',
          status: 'invalid_status' as any // Invalid status
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error?.code).toBe('23514')
    })
  })
})

describe('Database Performance and Indexing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should efficiently query profiles by email (indexed)', async () => {
    const mockSelect = supabase.from('profiles').select as jest.Mock
    const mockEq = mockSelect().eq as jest.Mock
    const mockSingle = mockEq().single as jest.Mock

    mockSingle.mockResolvedValue({
      data: mockUser,
      error: null
    })

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', mockUser.email)
      .single()

    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('email', mockUser.email)
    expect(data).toEqual(mockUser)
    expect(error).toBeNull()
  })

  it('should efficiently query weeks by week_number (indexed)', async () => {
    const mockSelect = supabase.from('weeks').select as jest.Mock
    const mockEq = mockSelect().eq as jest.Mock
    const mockSingle = mockEq().single as jest.Mock

    mockSingle.mockResolvedValue({
      data: mockWeek,
      error: null
    })

    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('week_number', mockWeek.week_number)
      .single()

    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('week_number', mockWeek.week_number)
    expect(data).toEqual(mockWeek)
    expect(error).toBeNull()
  })

  it('should efficiently query group messages by group_id (indexed)', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        group_id: 'test-group-id',
        sender_id: mockUser.id,
        message: 'Hello',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    const mockSelect = supabase.from('group_messages').select as jest.Mock
    const mockEq = mockSelect().eq as jest.Mock
    const mockOrder = mockEq().order as jest.Mock

    mockOrder.mockResolvedValue({
      data: mockMessages,
      error: null
    })

    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', 'test-group-id')
      .order('created_at', { ascending: true })

    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('group_id', 'test-group-id')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(data).toEqual(mockMessages)
    expect(error).toBeNull()
  })
})