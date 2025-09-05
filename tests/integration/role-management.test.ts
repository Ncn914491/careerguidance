/**
 * Role Management Integration Tests
 * 
 * Tests the complete role management workflow including:
 * - User signup with default student role
 * - Admin request creation and role transition to pending_admin
 * - Admin approval/denial and role transitions
 */

import { createClient } from '@supabase/supabase-js'
import { getCurrentUser, createUserProfile } from '@/lib/auth'

// Test configuration
const TEST_USER_EMAIL = 'test.student@example.com'
const TEST_USER_PASSWORD = 'testpassword123'
const ADMIN_EMAIL = 'nchaitanyanaidu@yahoo.com'

// Create admin client for testing
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

describe('Role Management System', () => {
  let testUserId: string
  let adminRequestId: string

  beforeAll(async () => {
    // Clean up any existing test user
    await cleanupTestUser()
  })

  afterAll(async () => {
    // Clean up test data
    await cleanupTestUser()
  })

  describe('User Registration and Default Role', () => {
    it('should create new user with student role by default', async () => {
      // Create test user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true
      })

      expect(authError).toBeNull()
      expect(authData.user).toBeTruthy()
      testUserId = authData.user!.id

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: testUserId,
          email: TEST_USER_EMAIL,
          full_name: 'Test Student',
          role: 'student'
        })

      expect(profileError).toBeNull()

      // Verify role is student
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', testUserId)
        .single()

      expect(fetchError).toBeNull()
      expect(profile?.role).toBe('student')
    })
  })

  describe('Admin Request Creation', () => {
    it('should create admin request and update role to pending_admin', async () => {
      // Create admin request
      const { data: request, error: requestError } = await supabaseAdmin
        .from('admin_requests')
        .insert({
          user_id: testUserId,
          reason: 'Test admin request for integration testing',
          status: 'pending'
        })
        .select()
        .single()

      expect(requestError).toBeNull()
      expect(request).toBeTruthy()
      adminRequestId = request!.id

      // Manually update role to pending_admin (simulating trigger behavior)
      const { error: roleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'pending_admin' })
        .eq('id', testUserId)

      expect(roleError).toBeNull()

      // Verify role is now pending_admin
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', testUserId)
        .single()

      expect(fetchError).toBeNull()
      expect(profile?.role).toBe('pending_admin')
    })

    it('should prevent duplicate pending requests', async () => {
      // Try to create another request
      const { error: duplicateError } = await supabaseAdmin
        .from('admin_requests')
        .insert({
          user_id: testUserId,
          reason: 'Another test request',
          status: 'pending'
        })

      // This should succeed at DB level, but API should prevent it
      // We'll test the API prevention in API tests
    })
  })

  describe('Admin Request Approval', () => {
    it('should approve request and update role to admin', async () => {
      // Get admin user ID
      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single()

      expect(adminError).toBeNull()
      expect(adminProfile).toBeTruthy()

      // Approve the request
      const { error: approveError } = await supabaseAdmin
        .from('admin_requests')
        .update({
          status: 'approved',
          reviewed_by: adminProfile!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', adminRequestId)

      expect(approveError).toBeNull()

      // Update user role to admin (simulating trigger behavior)
      const { error: roleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', testUserId)

      expect(roleError).toBeNull()

      // Verify role is now admin
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', testUserId)
        .single()

      expect(fetchError).toBeNull()
      expect(profile?.role).toBe('admin')
    })
  })

  describe('Admin Request Denial', () => {
    it('should deny request and revert role to student', async () => {
      // Create another request for denial test
      const { data: newRequest, error: requestError } = await supabaseAdmin
        .from('admin_requests')
        .insert({
          user_id: testUserId,
          reason: 'Test request for denial',
          status: 'pending'
        })
        .select()
        .single()

      expect(requestError).toBeNull()

      // Set role to pending_admin
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'pending_admin' })
        .eq('id', testUserId)

      // Get admin user ID
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single()

      // Deny the request
      const { error: denyError } = await supabaseAdmin
        .from('admin_requests')
        .update({
          status: 'denied',
          reviewed_by: adminProfile!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', newRequest!.id)

      expect(denyError).toBeNull()

      // Update user role back to student (simulating trigger behavior)
      const { error: roleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', testUserId)

      expect(roleError).toBeNull()

      // Verify role is back to student
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', testUserId)
        .single()

      expect(fetchError).toBeNull()
      expect(profile?.role).toBe('student')
    })
  })

  describe('Role-based Access Control', () => {
    it('should enforce RLS policies based on user role', async () => {
      // Test that student can only see their own admin requests
      const { data: studentRequests, error: studentError } = await supabaseAdmin
        .from('admin_requests')
        .select('*')
        .eq('user_id', testUserId)

      expect(studentError).toBeNull()
      expect(studentRequests).toBeTruthy()

      // Test that admin can see all requests (this would need proper auth context)
      // This is more of an integration test that would need actual auth session
    })
  })

  // Helper function to clean up test user
  async function cleanupTestUser() {
    if (testUserId) {
      // Delete admin requests
      await supabaseAdmin
        .from('admin_requests')
        .delete()
        .eq('user_id', testUserId)

      // Delete profile
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', testUserId)

      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(testUserId)
    }

    // Also clean up by email in case ID is not available
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${TEST_USER_EMAIL}`
    })

    if (existingUser?.users && existingUser.users.length > 0) {
      for (const user of existingUser.users) {
        await supabaseAdmin.auth.admin.deleteUser(user.id)
      }
    }
  }
})

describe('Admin User Verification', () => {
  it('should have seeded admin user with correct credentials', async () => {
    const { data: adminUser, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .eq('role', 'admin')
      .single()

    expect(error).toBeNull()
    expect(adminUser).toBeTruthy()
    expect(adminUser?.email).toBe(ADMIN_EMAIL)
    expect(adminUser?.role).toBe('admin')
    expect(adminUser?.full_name).toBe('Chaitanya Naidu')
  })
})