import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

const { getCurrentUser } = require('@/lib/auth');

// Test database setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

describe('Admin Requests API', () => {
  let testUserId: string;
  let adminUserId: string;

  beforeEach(async () => {
    // Create test users
    const { data: testUser } = await supabase.auth.admin.createUser({
      email: 'test-student@example.com',
      password: 'testpass123',
      email_confirm: true
    });
    testUserId = testUser.user!.id;

    const { data: adminUser } = await supabase.auth.admin.createUser({
      email: 'test-admin@example.com',
      password: 'adminpass123',
      email_confirm: true
    });
    adminUserId = adminUser.user!.id;

    // Create profiles
    await supabase.from('profiles').insert([
      {
        id: testUserId,
        email: 'test-student@example.com',
        full_name: 'Test Student',
        role: 'student'
      },
      {
        id: adminUserId,
        email: 'test-admin@example.com',
        full_name: 'Test Admin',
        role: 'admin'
      }
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await supabase.from('admin_requests').delete().in('user_id', [testUserId, adminUserId]);
    await supabase.from('profiles').delete().in('id', [testUserId, adminUserId]);
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.auth.admin.deleteUser(adminUserId);
  });

  describe('POST /api/admin/requests', () => {
    it('should create admin request for authenticated student', async () => {
      // Mock authenticated student
      getCurrentUser.mockResolvedValue({
        user: { id: testUserId, email: 'test-student@example.com' },
        isAdmin: false
      });

      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'I need admin access to help with content management' })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.request).toBeDefined();
      expect(data.request.user_id).toBe(testUserId);
      expect(data.request.status).toBe('pending');
    });

    it('should reject request without reason', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: testUserId, email: 'test-student@example.com' },
        isAdmin: false
      });

      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Reason is required');
    });

    it('should reject duplicate pending requests', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: testUserId, email: 'test-student@example.com' },
        isAdmin: false
      });

      // Create first request
      await supabase.from('admin_requests').insert({
        user_id: testUserId,
        reason: 'First request',
        status: 'pending'
      });

      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Second request' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('You already have a pending admin request');
    });

    it('should reject unauthenticated requests', async () => {
      getCurrentUser.mockResolvedValue({ user: null, isAdmin: false });

      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Test reason' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/requests', () => {
    it('should return all requests for admin users', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: adminUserId, email: 'test-admin@example.com' },
        isAdmin: true
      });

      // Create test request
      await supabase.from('admin_requests').insert({
        user_id: testUserId,
        reason: 'Test request',
        status: 'pending'
      });

      const response = await fetch('/api/admin/requests');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.requests).toBeDefined();
      expect(data.requests.length).toBeGreaterThan(0);
    });

    it('should return only user requests for students', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: testUserId, email: 'test-student@example.com' },
        isAdmin: false
      });

      // Create request for test user
      await supabase.from('admin_requests').insert({
        user_id: testUserId,
        reason: 'My request',
        status: 'pending'
      });

      const response = await fetch('/api/admin/requests');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.requests).toBeDefined();
      expect(data.requests.every((req: any) => req.user_id === testUserId)).toBe(true);
    });
  });

  describe('PATCH /api/admin/requests/[id]', () => {
    let requestId: string;

    beforeEach(async () => {
      const { data } = await supabase.from('admin_requests').insert({
        user_id: testUserId,
        reason: 'Test request for approval',
        status: 'pending'
      }).select().single();
      requestId = data!.id;
    });

    it('should approve admin request and update user role', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: adminUserId, email: 'test-admin@example.com' },
        isAdmin: true
      });

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      expect(response.status).toBe(200);
      
      // Check request was updated
      const { data: request } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      expect(request.status).toBe('approved');
      expect(request.reviewed_by).toBe(adminUserId);

      // Check user role was updated
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', testUserId)
        .single();
      
      expect(profile.role).toBe('admin');
    });

    it('should deny admin request without updating user role', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: adminUserId, email: 'test-admin@example.com' },
        isAdmin: true
      });

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny' })
      });

      expect(response.status).toBe(200);
      
      // Check request was updated
      const { data: request } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      expect(request.status).toBe('denied');
      expect(request.reviewed_by).toBe(adminUserId);

      // Check user role was NOT updated
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', testUserId)
        .single();
      
      expect(profile.role).toBe('student');
    });

    it('should reject non-admin users', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: testUserId, email: 'test-student@example.com' },
        isAdmin: false
      });

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      expect(response.status).toBe(403);
    });

    it('should reject invalid actions', async () => {
      getCurrentUser.mockResolvedValue({
        user: { id: adminUserId, email: 'test-admin@example.com' },
        isAdmin: true
      });

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid' })
      });

      expect(response.status).toBe(400);
    });

    it('should reject processing already processed requests', async () => {
      // Mark request as already approved
      await supabase
        .from('admin_requests')
        .update({ status: 'approved', reviewed_by: adminUserId })
        .eq('id', requestId);

      getCurrentUser.mockResolvedValue({
        user: { id: adminUserId, email: 'test-admin@example.com' },
        isAdmin: true
      });

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Request has already been processed');
    });
  });
});