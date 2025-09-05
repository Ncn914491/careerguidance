/**
 * @jest-environment node
 */

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NODE_ENV = 'development'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
      admin: {
        createUser: jest.fn(),
        getUserByEmail: jest.fn()
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
  }))
}))

import { createMocks } from 'node-mocks-http'
import loginHandler from '../../src/pages/api/auth/login'
import logoutHandler from '../../src/pages/api/auth/logout'
import meHandler from '../../src/pages/api/auth/me'

// Get mocked functions
const { createClient } = require('@supabase/supabase-js')
const mockSupabaseClient = createClient()
const mockSignInWithPassword = mockSupabaseClient.auth.signInWithPassword
const mockGetSession = mockSupabaseClient.auth.getSession
const mockSignOut = mockSupabaseClient.auth.signOut

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should return 400 for missing credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Email and password are required'
    })
  })

  it('should handle successful admin login with bypass', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'nchaitanyanaidu@yahoo.com'
        }
      },
      error: null
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'nchaitanyanaidu@yahoo.com',
        password: 'adminncn@20'
      }
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData.message).toBe('Authentication successful')
    expect(responseData.isAdmin).toBe(true)
    expect(responseData.bypassUsed).toBe(true)
  })
})

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await logoutHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should handle successful logout', async () => {
    mockSignOut.mockResolvedValue({
      error: null
    })

    const { req, res } = createMocks({
      method: 'POST'
    })

    await logoutHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Signed out successfully'
    })
  })
})

describe('/api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    })

    await meHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should return 401 for unauthenticated user', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { req, res } = createMocks({
      method: 'GET'
    })

    await meHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Not authenticated'
    })
  })
})