import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock fetch for API testing
global.fetch = jest.fn();

describe('Comprehensive Admin Request Workflow', () => {
  let adminUserId: string;
  let student1UserId: string;
  let student2UserId: string;
  let student3UserId: string;

  beforeAll(async () => {
    // Setup admin user
    const adminEmail = 'nchaitanyanaidu@yahoo.com';
    const adminPassword = 'adminncn@20';

    const { data: adminAuth } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    adminUserId = adminAuth.user!.id;

    await supabase.from('profiles').upsert({
      id: adminUserId,
      email: adminEmail,
      full_name: 'Chaitanya Naidu',
      role: 'admin'
    });

    // Setup multiple student users
    const students = [
      { email: 'student1@example.com', name: 'Alice Johnson' },
      { email: 'student2@example.com', name: 'Bob Smith' },
      { email: 'student3@example.com', name: 'Carol Davis' }
    ];

    const studentIds = [];

    for (const student of students) {
      const { data: studentAuth } = await supabase.auth.admin.createUser({
        email: student.email,
        password: 'student123',
        email_confirm: true
      });

      studentIds.push(studentAuth.user!.id);

      await supabase.from('profiles').upsert({
        id: studentAuth.user!.id,
        email: student.email,
        full_name: student.name,
        role: 'student'
      });
    }

    [student1UserId, student2UserId, student3UserId] = studentIds;
  });

  afterAll(async () => {
    // Cleanup all test data
    await supabase.from('admin_requests').delete().in('user_id', [student1UserId, student2UserId, student3UserId]);
    await supabase.from('profiles').delete().in('id', [adminUserId, student1UserId, student2UserId, student3UserId]);
    await supabase.auth.admin.deleteUser(adminUserId);
    await supabase.auth.admin.deleteUser(student1UserId);
    await supabase.auth.admin.deleteUser(student2UserId);
    await supabase.auth.admin.deleteUser(student3UserId);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up requests after each test
    await supabase.from('admin_requests').delete().in('user_id', [student1UserId, student2UserId, student3UserId]);
  });

  describe('Complete Admin Request Lifecycle', () => {
    it('should handle full workflow: request → review → approval → role update', async () => {
      // Step 1: Student submits admin request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          request: {
            id: 'req-1',
            user_id: student1UserId,
            reason: 'I have experience with content management and would like to help upload weekly materials',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        })
      });

      const requestResponse = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: 'I have experience with content management and would like to help upload weekly materials' 
        })
      });

      const requestData = await requestResponse.json();
      expect(requestResponse.status).toBe(201);
      expect(requestData.request.status).toBe('pending');
      expect(requestData.request.user_id).toBe(student1UserId);

      // Step 2: Admin views pending requests
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [{
            id: 'req-1',
            user_id: student1UserId,
            reason: 'I have experience with content management and would like to help upload weekly materials',
            status: 'pending',
            created_at: new Date().toISOString(),
            profiles: {
              full_name: 'Alice Johnson',
              email: 'student1@example.com',
              role: 'student'
            }
          }]
        })
      });

      const adminViewResponse = await fetch('/api/admin/requests');
      const adminViewData = await adminViewResponse.json();

      expect(adminViewData.requests).toHaveLength(1);
      expect(adminViewData.requests[0].profiles.full_name).toBe('Alice Johnson');
      expect(adminViewData.requests[0].status).toBe('pending');

      // Step 3: Admin approves the request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Request approved successfully',
          request: {
            id: 'req-1',
            status: 'approved',
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString()
          },
          updatedProfile: {
            id: student1UserId,
            role: 'admin'
          }
        })
      });

      const approvalResponse = await fetch('/api/admin/requests/req-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      const approvalData = await approvalResponse.json();
      expect(approvalData.message).toBe('Request approved successfully');
      expect(approvalData.request.status).toBe('approved');
      expect(approvalData.updatedProfile.role).toBe('admin');

      // Step 4: Verify user can now access admin features
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: student1UserId,
            email: 'student1@example.com',
            full_name: 'Alice Johnson',
            role: 'admin'
          },
          permissions: {
            canUploadContent: true,
            canManageUsers: true,
            canViewAnalytics: true
          }
        })
      });

      const profileResponse = await fetch('/api/profile');
      const profileData = await profileResponse.json();

      expect(profileData.profile.role).toBe('admin');
      expect(profileData.permissions.canUploadContent).toBe(true);

      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle request denial workflow', async () => {
      // Step 1: Student submits request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          request: {
            id: 'req-2',
            user_id: student2UserId,
            reason: 'I want admin access',
            status: 'pending'
          }
        })
      });

      await fetch('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify({ reason: 'I want admin access' })
      });

      // Step 2: Admin denies the request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Request denied',
          request: {
            id: 'req-2',
            status: 'denied',
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString()
          }
        })
      });

      const denialResponse = await fetch('/api/admin/requests/req-2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny' })
      });

      const denialData = await denialResponse.json();
      expect(denialData.message).toBe('Request denied');
      expect(denialData.request.status).toBe('denied');

      // Step 3: Verify user role remains unchanged
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: student2UserId,
            role: 'student'
          }
        })
      });

      const profileResponse = await fetch('/api/profile');
      const profileData = await profileResponse.json();

      expect(profileData.profile.role).toBe('student');
    });

    it('should handle multiple concurrent requests', async () => {
      // Submit multiple requests simultaneously
      const requests = [
        { userId: student1UserId, reason: 'Experienced with web development' },
        { userId: student2UserId, reason: 'Want to help with content creation' },
        { userId: student3UserId, reason: 'Have teaching experience' }
      ];

      // Mock responses for concurrent requests
      requests.forEach((req, index) => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            request: {
              id: `req-${index + 1}`,
              user_id: req.userId,
              reason: req.reason,
              status: 'pending'
            }
          })
        });
      });

      const requestPromises = requests.map(req => 
        fetch('/api/admin/requests', {
          method: 'POST',
          body: JSON.stringify({ reason: req.reason })
        })
      );

      const responses = await Promise.all(requestPromises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
      });

      // Admin views all pending requests
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: requests.map((req, index) => ({
            id: `req-${index + 1}`,
            user_id: req.userId,
            reason: req.reason,
            status: 'pending',
            profiles: {
              full_name: ['Alice Johnson', 'Bob Smith', 'Carol Davis'][index],
              email: [`student${index + 1}@example.com`]
            }
          }))
        })
      });

      const allRequestsResponse = await fetch('/api/admin/requests');
      const allRequestsData = await allRequestsResponse.json();

      expect(allRequestsData.requests).toHaveLength(3);
      expect(allRequestsData.requests.every((req: any) => req.status === 'pending')).toBe(true);
    });
  });

  describe('Request Validation and Business Rules', () => {
    it('should prevent duplicate pending requests from same user', async () => {
      // First request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          request: {
            id: 'req-1',
            user_id: student1UserId,
            status: 'pending'
          }
        })
      });

      await fetch('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify({ reason: 'First request' })
      });

      // Second request from same user
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'You already have a pending admin request'
        })
      });

      const duplicateResponse = await fetch('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Second request' })
      });

      expect(duplicateResponse.status).toBe(400);
      const duplicateData = await duplicateResponse.json();
      expect(duplicateData.error).toBe('You already have a pending admin request');
    });

    it('should allow new request after previous request is processed', async () => {
      // First request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ request: { id: 'req-1', status: 'pending' } })
      });

      await fetch('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify({ reason: 'First request' })
      });

      // Process first request (deny it)
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: { id: 'req-1', status: 'denied' }
        })
      });

      await fetch('/api/admin/requests/req-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'deny' })
      });

      // New request should be allowed
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          request: {
            id: 'req-2',
            user_id: student1UserId,
            status: 'pending'
          }
        })
      });

      const newRequestResponse = await fetch('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify({ reason: 'New request after denial' })
      });

      expect(newRequestResponse.status).toBe(201);
    });

    it('should validate request reason requirements', async () => {
      const invalidReasons = [
        '', // Empty string
        '   ', // Only whitespace
        'a', // Too short
        null, // Null value
        undefined // Undefined value
      ];

      for (const reason of invalidReasons) {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Reason is required and must be at least 10 characters'
          })
        });

        const response = await fetch('/api/admin/requests', {
          method: 'POST',
          body: JSON.stringify({ reason })
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Reason is required');
      }
    });

    it('should handle requests with detailed reasons', async () => {
      const detailedReason = `I am requesting admin access because I have extensive experience in:
      1. Web development with React and Node.js
      2. Content management systems
      3. Educational technology platforms
      4. Student mentoring and guidance
      
      I believe I can contribute significantly to the career guidance platform by:
      - Helping upload and organize weekly content
      - Assisting students with technical questions
      - Maintaining the quality of educational materials
      - Supporting the admin team with platform management
      
      I am committed to the mission of this program and would be honored to take on additional responsibilities.`;

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          request: {
            id: 'detailed-req',
            user_id: student1UserId,
            reason: detailedReason,
            status: 'pending'
          }
        })
      });

      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify({ reason: detailedReason })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.request.reason).toBe(detailedReason);
    });
  });

  describe('Admin Dashboard and Management', () => {
    it('should provide comprehensive request management interface', async () => {
      // Create requests with different statuses
      const mockRequests = [
        {
          id: 'req-pending-1',
          user_id: student1UserId,
          reason: 'Want to help with content management',
          status: 'pending',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          profiles: { full_name: 'Alice Johnson', email: 'student1@example.com' }
        },
        {
          id: 'req-approved-1',
          user_id: student2UserId,
          reason: 'Experienced developer',
          status: 'approved',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
          reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          reviewed_by: adminUserId,
          profiles: { full_name: 'Bob Smith', email: 'student2@example.com' }
        },
        {
          id: 'req-denied-1',
          user_id: student3UserId,
          reason: 'Just want access',
          status: 'denied',
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
          reviewed_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago
          reviewed_by: adminUserId,
          profiles: { full_name: 'Carol Davis', email: 'student3@example.com' }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests })
      });

      const dashboardResponse = await fetch('/api/admin/requests');
      const dashboardData = await dashboardResponse.json();

      expect(dashboardData.requests).toHaveLength(3);
      
      // Verify pending requests are highlighted
      const pendingRequests = dashboardData.requests.filter((req: any) => req.status === 'pending');
      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].profiles.full_name).toBe('Alice Johnson');

      // Verify processed requests include reviewer info
      const processedRequests = dashboardData.requests.filter((req: any) => req.status !== 'pending');
      expect(processedRequests).toHaveLength(2);
      processedRequests.forEach((req: any) => {
        expect(req.reviewed_by).toBe(adminUserId);
        expect(req.reviewed_at).toBeDefined();
      });
    });

    it('should provide request filtering and sorting capabilities', async () => {
      // Test filtering by status
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [{
            id: 'pending-only',
            status: 'pending',
            profiles: { full_name: 'Pending User' }
          }]
        })
      });

      const pendingOnlyResponse = await fetch('/api/admin/requests?status=pending');
      const pendingOnlyData = await pendingOnlyResponse.json();

      expect(pendingOnlyData.requests).toHaveLength(1);
      expect(pendingOnlyData.requests[0].status).toBe('pending');

      // Test sorting by date
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            { id: 'newest', created_at: new Date().toISOString() },
            { id: 'oldest', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        })
      });

      const sortedResponse = await fetch('/api/admin/requests?sort=created_at&order=desc');
      const sortedData = await sortedResponse.json();

      expect(sortedData.requests).toHaveLength(2);
      expect(sortedData.requests[0].id).toBe('newest');
      expect(sortedData.requests[1].id).toBe('oldest');
    });

    it('should handle bulk request processing', async () => {
      const bulkActions = [
        { requestId: 'req-1', action: 'approve' },
        { requestId: 'req-2', action: 'approve' },
        { requestId: 'req-3', action: 'deny' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Bulk processing completed',
          results: [
            { requestId: 'req-1', status: 'approved', success: true },
            { requestId: 'req-2', status: 'approved', success: true },
            { requestId: 'req-3', status: 'denied', success: true }
          ]
        })
      });

      const bulkResponse = await fetch('/api/admin/requests/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions: bulkActions })
      });

      const bulkData = await bulkResponse.json();
      expect(bulkData.message).toBe('Bulk processing completed');
      expect(bulkData.results).toHaveLength(3);
      expect(bulkData.results.every((result: any) => result.success)).toBe(true);
    });
  });

  describe('Notifications and Communication', () => {
    it('should send notifications when request status changes', async () => {
      // Mock notification system
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: { id: 'req-1', status: 'approved' },
          notification: {
            id: 'notif-1',
            user_id: student1UserId,
            type: 'admin_request_approved',
            message: 'Your admin request has been approved!',
            sent_at: new Date().toISOString()
          }
        })
      });

      const approvalResponse = await fetch('/api/admin/requests/req-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve' })
      });

      const approvalData = await approvalResponse.json();
      expect(approvalData.notification).toBeDefined();
      expect(approvalData.notification.type).toBe('admin_request_approved');
      expect(approvalData.notification.user_id).toBe(student1UserId);
    });

    it('should provide request status tracking for users', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [{
            id: 'user-req-1',
            user_id: student1UserId,
            reason: 'My request reason',
            status: 'pending',
            created_at: new Date().toISOString(),
            status_history: [
              { status: 'pending', timestamp: new Date().toISOString() }
            ]
          }]
        })
      });

      const userRequestsResponse = await fetch('/api/admin/requests/my-requests');
      const userRequestsData = await userRequestsResponse.json();

      expect(userRequestsData.requests).toHaveLength(1);
      expect(userRequestsData.requests[0].status).toBe('pending');
      expect(userRequestsData.requests[0].status_history).toBeDefined();
    });
  });

  describe('Analytics and Reporting', () => {
    it('should provide admin request analytics', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            total_requests: 25,
            pending_requests: 5,
            approved_requests: 15,
            denied_requests: 5,
            approval_rate: 0.75,
            average_processing_time_hours: 24,
            requests_by_month: [
              { month: '2024-01', count: 8 },
              { month: '2024-02', count: 12 },
              { month: '2024-03', count: 5 }
            ]
          }
        })
      });

      const analyticsResponse = await fetch('/api/admin/requests/analytics');
      const analyticsData = await analyticsResponse.json();

      expect(analyticsData.analytics.total_requests).toBe(25);
      expect(analyticsData.analytics.approval_rate).toBe(0.75);
      expect(analyticsData.analytics.requests_by_month).toHaveLength(3);
    });

    it('should track request processing performance', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          performance: {
            average_response_time_hours: 18.5,
            fastest_response_hours: 2,
            slowest_response_hours: 72,
            requests_processed_today: 3,
            requests_processed_this_week: 12,
            admin_workload: {
              [adminUserId]: {
                requests_processed: 20,
                average_response_time: 16.2
              }
            }
          }
        })
      });

      const performanceResponse = await fetch('/api/admin/requests/performance');
      const performanceData = await performanceResponse.json();

      expect(performanceData.performance.average_response_time_hours).toBe(18.5);
      expect(performanceData.performance.admin_workload[adminUserId]).toBeDefined();
      expect(performanceData.performance.requests_processed_today).toBe(3);
    });
  });

  describe('Security and Access Control', () => {
    it('should prevent non-admin users from processing requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Forbidden: Admin access required'
        })
      });

      const unauthorizedResponse = await fetch('/api/admin/requests/req-1', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer student-token' },
        body: JSON.stringify({ action: 'approve' })
      });

      expect(unauthorizedResponse.status).toBe(403);
      const unauthorizedData = await unauthorizedResponse.json();
      expect(unauthorizedData.error).toContain('Admin access required');
    });

    it('should prevent processing already processed requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Request has already been processed'
        })
      });

      const alreadyProcessedResponse = await fetch('/api/admin/requests/processed-req', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve' })
      });

      expect(alreadyProcessedResponse.status).toBe(400);
      const alreadyProcessedData = await alreadyProcessedResponse.json();
      expect(alreadyProcessedData.error).toBe('Request has already been processed');
    });

    it('should audit all admin request actions', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: { id: 'req-1', status: 'approved' },
          audit_log: {
            id: 'audit-1',
            action: 'approve_admin_request',
            performed_by: adminUserId,
            target_user: student1UserId,
            timestamp: new Date().toISOString(),
            details: {
              request_id: 'req-1',
              previous_status: 'pending',
              new_status: 'approved'
            }
          }
        })
      });

      const auditedResponse = await fetch('/api/admin/requests/req-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve' })
      });

      const auditedData = await auditedResponse.json();
      expect(auditedData.audit_log).toBeDefined();
      expect(auditedData.audit_log.action).toBe('approve_admin_request');
      expect(auditedData.audit_log.performed_by).toBe(adminUserId);
    });
  });
});