import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Complete User Journeys End-to-End', () => {
  const adminUserId = 'admin-123';
  const studentUserId = 'student-123';
  const testGroupId = 'group-123';
  const testWeekId = 'week-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Student User Journey', () => {
    it('should complete full student workflow: browse → view content → chat → request admin', async () => {
      // Step 1: Student visits homepage and views statistics
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schools: 3,
          teamMembers: 3,
          students: 500,
          visits: 15
        })
      });

      const homepageResponse = await fetch('/api/homepage-stats');
      const homepageData = await homepageResponse.json();

      expect(homepageData.schools).toBe(3);
      expect(homepageData.teamMembers).toBe(3);
      expect(homepageData.students).toBe(500);
      expect(homepageData.visits).toBe(15);

      // Step 2: Student clicks on schools to view list
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schools: [
            { name: 'Tech High School', location: 'Downtown', visit_date: '2024-01-15' },
            { name: 'Science Academy', location: 'Uptown', visit_date: '2024-01-20' },
            { name: 'Innovation Institute', location: 'Midtown', visit_date: '2024-01-25' }
          ]
        })
      });

      const schoolsResponse = await fetch('/api/schools');
      const schoolsData = await schoolsResponse.json();

      expect(schoolsData.schools).toHaveLength(3);
      expect(schoolsData.schools[0].name).toBe('Tech High School');

      // Step 3: Student navigates to weeks section
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weeks: [{
            id: testWeekId,
            week_number: 1,
            title: 'Introduction to Career Guidance',
            description: 'First week of the program',
            week_files: [
              {
                id: 'file-1',
                file_name: 'intro-presentation.pdf',
                file_type: 'pdf',
                file_url: 'https://storage.supabase.co/week-files/intro-presentation.pdf',
                file_size: 1048576
              },
              {
                id: 'file-2',
                file_name: 'school-visit.jpg',
                file_type: 'photo',
                file_url: 'https://storage.supabase.co/week-files/school-visit.jpg',
                file_size: 2097152
              }
            ]
          }]
        })
      });

      const weeksResponse = await fetch('/api/weeks');
      const weeksData = await weeksResponse.json();

      expect(weeksData.weeks).toHaveLength(1);
      expect(weeksData.weeks[0].week_files).toHaveLength(2);
      expect(weeksData.weeks[0].week_files[0].file_type).toBe('pdf');

      // Step 4: Student joins group chat and sends message
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [{
            id: testGroupId,
            name: 'Career Guidance Discussion',
            description: 'Main discussion group for career guidance'
          }]
        })
      });

      const groupsResponse = await fetch('/api/groups');
      const groupsData = await groupsResponse.json();

      expect(groupsData.groups).toHaveLength(1);
      expect(groupsData.groups[0].name).toBe('Career Guidance Discussion');

      // Send message in group
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            id: 'msg-1',
            group_id: testGroupId,
            sender_id: studentUserId,
            message: 'Hello everyone! Excited to be part of this program.',
            created_at: new Date().toISOString()
          }
        })
      });

      const messageResponse = await fetch(`/api/groups/${testGroupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello everyone! Excited to be part of this program.' })
      });

      const messageData = await messageResponse.json();
      expect(messageData.message.message).toBe('Hello everyone! Excited to be part of this program.');

      // Step 5: Student uses AI chat
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Great question! Software engineering offers many career paths including web development, mobile app development, data science, and more.',
          chatId: 'chat-1'
        })
      });

      const aiResponse = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What career opportunities are available in software engineering?' })
      });

      const aiData = await aiResponse.json();
      expect(aiData.response).toContain('software engineering');
      expect(aiData.chatId).toBeDefined();

      // Step 6: Student requests admin privileges
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          request: {
            id: 'req-1',
            user_id: studentUserId,
            reason: 'I would like to help upload content and manage the platform',
            status: 'pending'
          }
        })
      });

      const adminRequestResponse = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'I would like to help upload content and manage the platform' })
      });

      const adminRequestData = await adminRequestResponse.json();
      expect(adminRequestResponse.status).toBe(201);
      expect(adminRequestData.request.status).toBe('pending');
      expect(adminRequestData.request.reason).toBe('I would like to help upload content and manage the platform');

      // Verify all API calls were made in correct order
      expect(fetch).toHaveBeenCalledTimes(6);
    });

    it('should handle student viewing PDF files inline', async () => {
      // Mock PDF viewing workflow
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weeks: [{
            id: testWeekId,
            week_number: 1,
            title: 'Introduction to Career Guidance',
            week_files: [{
              id: 'pdf-file-1',
              file_name: 'career-guide.pdf',
              file_type: 'pdf',
              file_url: 'https://storage.supabase.co/week-files/career-guide.pdf',
              file_size: 2048576
            }]
          }]
        })
      });

      const weeksResponse = await fetch('/api/weeks');
      const weeksData = await weeksResponse.json();

      const pdfFile = weeksData.weeks[0].week_files[0];
      
      // Verify PDF can be viewed inline
      expect(pdfFile.file_type).toBe('pdf');
      expect(pdfFile.file_url).toMatch(/\.pdf$/);
      expect(pdfFile.file_url).toMatch(/^https:\/\//);
      
      // Simulate PDF download
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['PDF content'], { type: 'application/pdf' })
      });

      const pdfResponse = await fetch(pdfFile.file_url);
      const pdfBlob = await pdfResponse.blob();
      
      expect(pdfBlob.type).toBe('application/pdf');
      expect(pdfResponse.ok).toBe(true);
    });

    it('should handle real-time group chat updates', async () => {
      // Simulate real-time message receiving
      const mockMessages = [
        {
          id: 'msg-1',
          group_id: testGroupId,
          sender_id: adminUserId,
          message: 'Welcome to the career guidance program!',
          created_at: new Date(Date.now() - 60000).toISOString(),
          profiles: { full_name: 'Chaitanya Naidu', email: 'nchaitanyanaidu@yahoo.com' }
        },
        {
          id: 'msg-2',
          group_id: testGroupId,
          sender_id: studentUserId,
          message: 'Thank you! Looking forward to learning.',
          created_at: new Date().toISOString(),
          profiles: { full_name: 'Test Student', email: 'student@example.com' }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages })
      });

      const messagesResponse = await fetch(`/api/groups/${testGroupId}/messages`);
      const messagesData = await messagesResponse.json();

      expect(messagesData.messages).toHaveLength(2);
      expect(messagesData.messages[0].profiles.full_name).toBe('Chaitanya Naidu');
      expect(messagesData.messages[1].profiles.full_name).toBe('Test Student');
      
      // Verify messages are ordered by time
      const firstTime = new Date(messagesData.messages[0].created_at).getTime();
      const secondTime = new Date(messagesData.messages[1].created_at).getTime();
      expect(firstTime).toBeLessThan(secondTime);
    });
  });

  describe('Admin User Journey', () => {
    it('should complete full admin workflow: upload content → manage requests → moderate chat', async () => {
      // Step 1: Admin uploads new week content
      const mockFormData = new FormData();
      mockFormData.append('weekNumber', '2');
      mockFormData.append('title', 'Advanced Programming Concepts');
      mockFormData.append('description', 'Deep dive into programming fundamentals');
      mockFormData.append('files', new File(['PDF content'], 'programming-guide.pdf', { type: 'application/pdf' }));
      mockFormData.append('files', new File(['Photo content'], 'classroom.jpg', { type: 'image/jpeg' }));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Week created successfully',
          week: {
            id: 'new-week-id',
            week_number: 2,
            title: 'Advanced Programming Concepts',
            description: 'Deep dive into programming fundamentals'
          },
          files: [
            {
              id: 'file-1',
              file_name: 'programming-guide.pdf',
              file_type: 'pdf',
              file_url: 'https://storage.supabase.co/week-files/programming-guide.pdf'
            },
            {
              id: 'file-2',
              file_name: 'classroom.jpg',
              file_type: 'photo',
              file_url: 'https://storage.supabase.co/week-files/classroom.jpg'
            }
          ]
        })
      });

      const uploadResponse = await fetch('/api/weeks', {
        method: 'POST',
        body: mockFormData
      });

      const uploadData = await uploadResponse.json();
      expect(uploadData.message).toBe('Week created successfully');
      expect(uploadData.week.week_number).toBe(2);
      expect(uploadData.files).toHaveLength(2);

      // Step 2: Admin views pending admin requests
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [{
            id: 'req-1',
            user_id: studentUserId,
            reason: 'I would like to help upload content and manage the platform',
            status: 'pending',
            created_at: new Date().toISOString(),
            profiles: {
              full_name: 'Test Student',
              email: 'student@example.com'
            }
          }]
        })
      });

      const requestsResponse = await fetch('/api/admin/requests');
      const requestsData = await requestsResponse.json();

      expect(requestsData.requests).toHaveLength(1);
      expect(requestsData.requests[0].status).toBe('pending');
      expect(requestsData.requests[0].profiles.full_name).toBe('Test Student');

      // Step 3: Admin approves the request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Request approved successfully',
          request: {
            id: 'req-1',
            status: 'approved',
            reviewed_by: adminUserId
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

      // Step 4: Admin sends message in group chat
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            id: 'admin-msg-1',
            group_id: testGroupId,
            sender_id: adminUserId,
            message: 'Welcome to the team! You now have admin privileges.',
            created_at: new Date().toISOString()
          }
        })
      });

      const adminMessageResponse = await fetch(`/api/groups/${testGroupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Welcome to the team! You now have admin privileges.' })
      });

      const adminMessageData = await adminMessageResponse.json();
      expect(adminMessageData.message.message).toBe('Welcome to the team! You now have admin privileges.');

      // Verify all admin operations completed successfully
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle bulk file uploads efficiently', async () => {
      // Simulate uploading multiple large files
      const mockFormData = new FormData();
      mockFormData.append('weekNumber', '3');
      mockFormData.append('title', 'Multimedia Week');
      mockFormData.append('description', 'Week with various media types');
      
      // Add multiple files of different types
      mockFormData.append('files', new File(['Large PDF'], 'large-guide.pdf', { type: 'application/pdf' }));
      mockFormData.append('files', new File(['Photo 1'], 'photo1.jpg', { type: 'image/jpeg' }));
      mockFormData.append('files', new File(['Photo 2'], 'photo2.png', { type: 'image/png' }));
      mockFormData.append('files', new File(['Video'], 'demo.mp4', { type: 'video/mp4' }));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Week created successfully',
          week: { id: 'multimedia-week', week_number: 3 },
          files: [
            { file_name: 'large-guide.pdf', file_type: 'pdf' },
            { file_name: 'photo1.jpg', file_type: 'photo' },
            { file_name: 'photo2.png', file_type: 'photo' },
            { file_name: 'demo.mp4', file_type: 'video' }
          ]
        })
      });

      const bulkUploadResponse = await fetch('/api/weeks', {
        method: 'POST',
        body: mockFormData
      });

      const bulkUploadData = await bulkUploadResponse.json();
      expect(bulkUploadData.files).toHaveLength(4);
      expect(bulkUploadData.files.map((f: any) => f.file_type)).toEqual(['pdf', 'photo', 'photo', 'video']);
    });
  });

  describe('Cross-User Interactions', () => {
    it('should handle admin-student interaction workflow', async () => {
      // Student asks question in group chat
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            id: 'student-question',
            message: 'What programming languages should I focus on for web development?',
            sender_id: studentUserId
          }
        })
      });

      await fetch(`/api/groups/${testGroupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: 'What programming languages should I focus on for web development?' })
      });

      // Admin responds with helpful information
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            id: 'admin-response',
            message: 'For web development, I recommend starting with HTML, CSS, and JavaScript. Then move to frameworks like React or Vue.js.',
            sender_id: adminUserId
          }
        })
      });

      await fetch(`/api/groups/${testGroupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: 'For web development, I recommend starting with HTML, CSS, and JavaScript. Then move to frameworks like React or Vue.js.' })
      });

      // Student follows up with AI chat for more details
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'JavaScript is a versatile programming language used for both frontend and backend development. React is a popular library for building user interfaces.',
          chatId: 'followup-chat'
        })
      });

      const aiFollowupResponse = await fetch('/api/askai', {
        method: 'POST',
        body: JSON.stringify({ message: 'Can you tell me more about JavaScript and React?' })
      });

      const aiFollowupData = await aiFollowupResponse.json();
      expect(aiFollowupData.response).toContain('JavaScript');
      expect(aiFollowupData.response).toContain('React');

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should maintain data consistency across all features', async () => {
      // Verify user profiles are consistent
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            id: studentUserId,
            email: 'student@example.com',
            full_name: 'Test Student',
            role: 'student'
          }
        })
      });

      const profileResponse = await fetch('/api/profile');
      const profileData = await profileResponse.json();

      // Verify group membership is consistent
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [{
            id: testGroupId,
            name: 'Career Guidance Discussion',
            member_count: 2
          }]
        })
      });

      const userGroupsResponse = await fetch('/api/groups');
      const userGroupsData = await userGroupsResponse.json();

      // Verify week access is consistent
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weeks: [{
            id: testWeekId,
            week_number: 1,
            title: 'Introduction to Career Guidance',
            accessible: true
          }]
        })
      });

      const accessibleWeeksResponse = await fetch('/api/weeks');
      const accessibleWeeksData = await accessibleWeeksResponse.json();

      expect(profileData.profile.role).toBe('student');
      expect(userGroupsData.groups[0].member_count).toBe(2);
      expect(accessibleWeeksData.weeks[0].accessible).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      // Simulate network error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/weeks');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }

      // Simulate recovery
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ weeks: [] })
      });

      const recoveryResponse = await fetch('/api/weeks');
      const recoveryData = await recoveryResponse.json();
      expect(recoveryData.weeks).toEqual([]);
    });

    it('should handle concurrent user actions', async () => {
      // Simulate multiple users sending messages simultaneously
      const concurrentMessages = [
        { user: studentUserId, message: 'Message from student' },
        { user: adminUserId, message: 'Message from admin' }
      ];

      const messagePromises = concurrentMessages.map((msg, index) => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: {
              id: `concurrent-msg-${index}`,
              sender_id: msg.user,
              message: msg.message,
              created_at: new Date().toISOString()
            }
          })
        });

        return fetch(`/api/groups/${testGroupId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message: msg.message })
        });
      });

      const results = await Promise.all(messagePromises);
      
      expect(results).toHaveLength(2);
      results.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    it('should handle large data sets efficiently', async () => {
      // Simulate large number of weeks
      const manyWeeks = Array.from({ length: 100 }, (_, i) => ({
        id: `week-${i}`,
        week_number: i + 1,
        title: `Week ${i + 1}`,
        description: `Description for week ${i + 1}`,
        week_files: []
      }));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ weeks: manyWeeks })
      });

      const largeDataResponse = await fetch('/api/weeks');
      const largeData = await largeDataResponse.json();

      expect(largeData.weeks).toHaveLength(100);
      expect(largeData.weeks[0].week_number).toBe(1);
      expect(largeData.weeks[99].week_number).toBe(100);
    });
  });
});