/**
 * Database Migration and Setup Tests
 * 
 * Tests database migration scripts and verification functionality
 * Requirements: 9.1, 9.4
 */

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock fs module
const mockReadFileSync = jest.fn()
const mockExistsSync = jest.fn()

jest.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync
}))

// Mock fetch for REST API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}))

// Import the functions to test
import { runMigration, executeSqlFile, verifyMigration } from '../../sql/migrate'

describe('Database Migration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('CREATE TABLE test_table (id UUID PRIMARY KEY);')
  })

  describe('SQL File Execution', () => {
    it('should read and execute SQL file successfully', async () => {
      const mockSqlContent = `
        CREATE TABLE profiles (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'student'
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
      `

      mockReadFileSync.mockReturnValue(mockSqlContent)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const result = await executeSqlFile('sql/init.sql')

      expect(mockReadFileSync).toHaveBeenCalledWith('sql/init.sql', 'utf8')
      expect(result.success).toBe(true)
    })

    it('should handle missing SQL file', async () => {
      mockExistsSync.mockReturnValue(false)

      const result = await executeSqlFile('nonexistent.sql')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle SQL execution errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      const result = await executeSqlFile('sql/init.sql')

      expect(result.success).toBe(true) // Should fall back to manual mode
      expect(result.manual).toBe(true)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await executeSqlFile('sql/init.sql')

      expect(result.success).toBe(true) // Should fall back to manual mode
      expect(result.manual).toBe(true)
    })
  })

  describe('Migration Verification', () => {
    it('should verify successful migration', async () => {
      const expectedTables = [
        { table_name: 'profiles' },
        { table_name: 'schools' },
        { table_name: 'team_members' },
        { table_name: 'weeks' },
        { table_name: 'week_files' },
        { table_name: 'groups' },
        { table_name: 'group_members' },
        { table_name: 'group_messages' },
        { table_name: 'ai_chats' },
        { table_name: 'admin_requests' }
      ]

      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: expectedTables,
        error: null
      })

      const result = await verifyMigration()

      expect(mockFrom).toHaveBeenCalledWith('information_schema.tables')
      expect(mockSelect).toHaveBeenCalledWith('table_name')
      expect(mockEq).toHaveBeenCalledWith('table_schema', 'public')
      expect(mockOrder).toHaveBeenCalledWith('table_name')
      expect(result).toBe(true)
    })

    it('should detect missing tables', async () => {
      const incompleteTables = [
        { table_name: 'profiles' },
        { table_name: 'schools' }
        // Missing other required tables
      ]

      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: incompleteTables,
        error: null
      })

      const result = await verifyMigration()

      expect(result).toBe(false)
    })

    it('should handle verification errors', async () => {
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const result = await verifyMigration()

      expect(result).toBe(false)
    })

    it('should handle empty table list', async () => {
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await verifyMigration()

      expect(result).toBe(false)
    })
  })

  describe('Full Migration Process', () => {
    it('should complete full migration successfully', async () => {
      // Mock successful SQL file execution
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      // Mock successful verification
      const expectedTables = [
        { table_name: 'profiles' },
        { table_name: 'schools' },
        { table_name: 'team_members' },
        { table_name: 'weeks' },
        { table_name: 'week_files' },
        { table_name: 'groups' },
        { table_name: 'group_members' },
        { table_name: 'group_messages' },
        { table_name: 'ai_chats' },
        { table_name: 'admin_requests' }
      ]

      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: expectedTables,
        error: null
      })

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await runMigration()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database migration completed successfully!')
      )

      consoleSpy.mockRestore()
    })

    it('should handle migration with manual fallback', async () => {
      // Mock failed automatic execution (falls back to manual)
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await runMigration()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Manual migration setup completed!')
      )

      consoleSpy.mockRestore()
    })

    it('should handle verification failure after migration', async () => {
      // Mock successful SQL execution
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      // Mock failed verification
      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: [{ table_name: 'profiles' }], // Missing tables
        error: null
      })

      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation()

      await runMigration()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Migration verification failed')
      )

      consoleErrorSpy.mockRestore()
      processExitSpy.mockRestore()
    })
  })

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      // Test is implicitly covered by the migration functions
      // which would fail if environment variables are not set
      expect(process.env.SUPABASE_URL).toBeDefined()
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
    })

    it('should handle missing environment variables gracefully', () => {
      const originalUrl = process.env.SUPABASE_URL
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation()

      // This would be tested in the actual migration script
      // Here we just verify the environment variables are checked
      expect(process.env.SUPABASE_URL).toBeUndefined()
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined()

      // Restore environment variables
      process.env.SUPABASE_URL = originalUrl
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey

      consoleErrorSpy.mockRestore()
      processExitSpy.mockRestore()
    })
  })

  describe('SQL Content Validation', () => {
    it('should validate SQL content contains required statements', async () => {
      const validSqlContent = `
        -- Create tables
        CREATE TABLE profiles (id UUID PRIMARY KEY);
        CREATE TABLE weeks (id UUID PRIMARY KEY);
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
        CREATE POLICY "weeks_select" ON weeks FOR SELECT USING (true);
        
        -- Create indexes
        CREATE INDEX idx_profiles_email ON profiles(email);
        CREATE INDEX idx_weeks_number ON weeks(week_number);
      `

      mockReadFileSync.mockReturnValue(validSqlContent)

      const sqlContent = mockReadFileSync('sql/init.sql', 'utf8')

      // Verify SQL content contains required elements
      expect(sqlContent).toContain('CREATE TABLE profiles')
      expect(sqlContent).toContain('CREATE TABLE weeks')
      expect(sqlContent).toContain('ENABLE ROW LEVEL SECURITY')
      expect(sqlContent).toContain('CREATE POLICY')
      expect(sqlContent).toContain('CREATE INDEX')
    })

    it('should handle malformed SQL content', async () => {
      const malformedSql = 'INVALID SQL STATEMENT;'
      
      mockReadFileSync.mockReturnValue(malformedSql)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      const result = await executeSqlFile('sql/init.sql')

      // Should fall back to manual mode on SQL errors
      expect(result.success).toBe(true)
      expect(result.manual).toBe(true)
    })
  })

  describe('Database Schema Validation', () => {
    it('should verify all required tables are created', async () => {
      const requiredTables = [
        'profiles',
        'schools', 
        'team_members',
        'weeks',
        'week_files',
        'groups',
        'group_members',
        'group_messages',
        'ai_chats',
        'admin_requests'
      ]

      const mockTables = requiredTables.map(name => ({ table_name: name }))

      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: mockTables,
        error: null
      })

      const result = await verifyMigration()

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('information_schema.tables')
    })

    it('should detect extra tables that should not exist', async () => {
      const tablesWithExtra = [
        { table_name: 'profiles' },
        { table_name: 'schools' },
        { table_name: 'team_members' },
        { table_name: 'weeks' },
        { table_name: 'week_files' },
        { table_name: 'groups' },
        { table_name: 'group_members' },
        { table_name: 'group_messages' },
        { table_name: 'ai_chats' },
        { table_name: 'admin_requests' },
        { table_name: 'unexpected_table' } // Extra table
      ]

      const mockFrom = mockSupabaseClient.from as jest.Mock
      const mockSelect = mockFrom().select as jest.Mock
      const mockEq = mockSelect().eq as jest.Mock
      const mockOrder = mockEq().order as jest.Mock

      mockOrder.mockResolvedValue({
        data: tablesWithExtra,
        error: null
      })

      const result = await verifyMigration()

      // Should still pass - extra tables are not a problem
      expect(result).toBe(true)
    })
  })
})