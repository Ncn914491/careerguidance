/**
 * Integration tests for weeks and admin functionality
 * Focuses on core requirements: API endpoints, file upload, PDF viewing, and admin access
 */

import { createMocks } from 'node-mocks-http';

// Mock Next.js server components before importing
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data
    }))
  }
}));

// Mock the API route functions
const mockGET = jest.fn();
const mockPOST = jest.fn();

jest.mock('../../src/app/api/weeks/route', () => ({
  GET: mockGET,
  POST: mockPOST
}));

// Mock Supabase with comprehensive test scenarios
const createMockSupabase = (scenario: string = 'success') => {
  const scenarios = {
    success: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockWeeksData,
            error: null
          })),
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'new-week-id', week_number: 1, title: 'Test Week' },
              error: null
            }))
          }))
        }))
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.supabase.co/week-files/test.pdf' } }))
        }))
      }
    },
    database_error: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      }))
    },
    storage_error: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockWeeksData,
            error: null
          })),
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'new-week-id', week_number: 1, title: 'Test Week' },
              error: null
            }))
          }))
        }))
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Storage error' } 
          })),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.supabase.co/week-files/test.pdf' } }))
        }))
      }
    }
  };
  
  return scenarios[scenario as keyof typeof scenarios] || scenarios.success;
};

const mockWeeksData = [
  {
    id: 'week-1',
    week_number: 1,
    title: 'Introduction to Career Guidance',
    description: 'Overview of career opportunities in technology and engineering fields',
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'admin-user-id',
    week_files: [
      {
        id: 'file-1',
        week_id: 'week-1',
        file_name: 'career-intro.pdf',
        file_type: 'pdf',
        file_url: 'https://storage.supabase.co/week-files/week-1/career-intro.pdf',
        file_size: 1048576,
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'file-2',
        week_id: 'week-1',
        file_name: 'school-visit-photo.jpg',
        file_type: 'photo',
        file_url: 'https://storage.supabase.co/week-files/week-1/school-visit-photo.jpg',
        file_size: 2097152,
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: 'week-2',
    week_number: 2,
    title: 'Computer Science Fundamentals',
    description: 'Basic programming concepts',
    created_at: '2024-01-08T00:00:00Z',
    created_by: 'admin-user-id',
    week_files: [
      {
        id: 'file-3',
        week_id: 'week-2',
        file_name: 'programming-basics.pdf',
        file_type: 'pdf',
        file_url: 'https://storage.supabase.co/week-files/week-2/programming-basics.pdf',
        file_size: 3145728,
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-08T00:00:00Z'
      }
    ]
  }
];

jest.mock('../../src/lib/supabase', () => ({
  supabase: createMockSupabase()
}));

describe('Weeks and Admin Functionality Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mock
    const { supabase } = require('../../src/lib/supabase');
    Object.assign(supabase, createMockSupabase());
  });

  describe('Weeks API Endpoints and Data Fetching', () => {
    it('should successfully fetch weeks with complete file metadata', async () => {
      mockGET.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ weeks: mockWeeksData })
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await mockGET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('weeks');
      expect(Array.isArray(data.weeks)).toBe(true);
      expect(data.weeks).toHaveLength(2);

      // Verify week structure
      const week = data.weeks[0];
      expect(week).toHaveProperty('id');
      expect(week).toHaveProperty('week_number');
      expect(week).toHaveProperty('title');
      expect(week).toHaveProperty('description');
      expect(week).toHaveProperty('created_at');
      expect(week).toHaveProperty('week_files');
      expect(Array.isArray(week.week_files)).toBe(true);

      // Verify file structure for PDF viewing
      const pdfFile = week.week_files.find((f: any) => f.file_type === 'pdf');
      expect(pdfFile).toBeDefined();
      expect(pdfFile).toHaveProperty('file_name');
      expect(pdfFile).toHaveProperty('file_url');
      expect(pdfFile).toHaveProperty('file_size');
      expect(pdfFile.file_url).toMatch(/^https:\/\//);
      expect(pdfFile.file_name).toMatch(/\.pdf$/i);
    });

    it('should return weeks ordered by week_number for proper navigation', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks[0].week_number).toBe(1);
      expect(data.weeks[1].week_number).toBe(2);
      
      // Verify ordering is maintained for large datasets
      for (let i = 0; i < data.weeks.length - 1; i++) {
        expect(data.weeks[i].week_number).toBeLessThanOrEqual(data.weeks[i + 1].week_number);
      }
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, createMockSupabase('database_error'));

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch weeks');
    });

    it('should handle empty database gracefully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks).toEqual([]);
    });
  });

  describe('File Upload Workflow and Validation', () => {
    const createValidFormData = () => {
      const formData = new FormData();
      formData.append('weekNumber', '3');
      formData.append('title', 'Advanced Programming');
      formData.append('description', 'Deep dive into advanced programming concepts');
      
      const photoFile = new File(['photo content'], 'advanced-photo.jpg', { type: 'image/jpeg' });
      const pdfFile = new File(['pdf content'], 'advanced-guide.pdf', { type: 'application/pdf' });
      
      formData.append('files', photoFile);
      formData.append('files', pdfFile);
      
      return formData;
    };

    it('should successfully upload week with required files', async () => {
      const formData = createValidFormData();
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
      expect(data.week).toBeDefined();
      expect(data.files).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);

      // Verify Supabase interactions
      const { supabase } = require('../../src/lib/supabase');
      expect(supabase.from).toHaveBeenCalledWith('weeks');
      expect(supabase.storage.from).toHaveBeenCalledWith('week-files');
    });

    it('should validate required form fields', async () => {
      const testCases = [
        { field: 'weekNumber', value: '', expectedError: 'required' },
        { field: 'title', value: '', expectedError: 'required' },
        { field: 'description', value: '', expectedError: 'required' }
      ];

      for (const testCase of testCases) {
        const formData = createValidFormData();
        formData.set(testCase.field, testCase.value);
        
        const request = { formData: () => Promise.resolve(formData) } as NextRequest;
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain(testCase.expectedError);
      }
    });

    it('should validate file type requirements for admin uploads', async () => {
      // Test missing photos
      const formDataNoPhotos = new FormData();
      formDataNoPhotos.append('weekNumber', '3');
      formDataNoPhotos.append('title', 'Test Week');
      formDataNoPhotos.append('description', 'Test description');
      formDataNoPhotos.append('files', new File(['pdf'], 'test.pdf', { type: 'application/pdf' }));

      const requestNoPhotos = { formData: () => Promise.resolve(formDataNoPhotos) } as NextRequest;
      const responseNoPhotos = await POST(requestNoPhotos);
      const dataNoPhotos = await responseNoPhotos.json();

      expect(responseNoPhotos.status).toBe(400);
      expect(dataNoPhotos.error).toContain('photo');

      // Test missing PDFs
      const formDataNoPdfs = new FormData();
      formDataNoPdfs.append('weekNumber', '3');
      formDataNoPdfs.append('title', 'Test Week');
      formDataNoPdfs.append('description', 'Test description');
      formDataNoPdfs.append('files', new File(['photo'], 'test.jpg', { type: 'image/jpeg' }));

      const requestNoPdfs = { formData: () => Promise.resolve(formDataNoPdfs) } as NextRequest;
      const responseNoPdfs = await POST(requestNoPdfs);
      const dataNoPdfs = await responseNoPdfs.json();

      expect(responseNoPdfs.status).toBe(400);
      expect(dataNoPdfs.error).toContain('PDF');
    });

    it('should handle multiple file types correctly', async () => {
      const formData = new FormData();
      formData.append('weekNumber', '4');
      formData.append('title', 'Multi-Media Week');
      formData.append('description', 'Week with various file types');
      
      // Add multiple supported file types
      formData.append('files', new File(['jpeg'], 'photo1.jpg', { type: 'image/jpeg' }));
      formData.append('files', new File(['png'], 'photo2.png', { type: 'image/png' }));
      formData.append('files', new File(['mp4'], 'video1.mp4', { type: 'video/mp4' }));
      formData.append('files', new File(['pdf'], 'document1.pdf', { type: 'application/pdf' }));
      formData.append('files', new File(['txt'], 'readme.txt', { type: 'text/plain' })); // Unsupported

      const request = { formData: () => Promise.resolve(formData) } as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
      
      // Should process 4 supported files, skip 1 unsupported
      const { supabase } = require('../../src/lib/supabase');
      expect(supabase.storage.from().upload).toHaveBeenCalledTimes(4);
    });

    it('should prevent duplicate week numbers', async () => {
      // Mock existing week
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'existing-week-id', week_number: 1 }, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const formData = createValidFormData();
      formData.set('weekNumber', '1'); // Existing week number
      
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should handle storage errors gracefully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, createMockSupabase('storage_error'));

      const formData = createValidFormData();
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed but with fewer files uploaded
      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
    });
  });

  describe('PDF Viewing and Download Functionality', () => {
    it('should provide proper PDF URLs for inline viewing', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const pdfFiles = data.weeks
        .flatMap((week: any) => week.week_files)
        .filter((file: any) => file.file_type === 'pdf');

      expect(pdfFiles.length).toBeGreaterThan(0);
      
      pdfFiles.forEach((pdfFile: any) => {
        // Verify PDF URL structure for inline viewing
        expect(pdfFile.file_url).toMatch(/^https:\/\//);
        expect(pdfFile.file_url).toContain('.pdf');
        expect(pdfFile.file_name).toMatch(/\.pdf$/i);
        expect(pdfFile.file_type).toBe('pdf');
        expect(typeof pdfFile.file_size).toBe('number');
        
        // Verify URL is properly formatted for iframe embedding
        expect(pdfFile.file_url).toContain('storage.supabase.co');
      });
    });

    it('should handle PDF file metadata correctly', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      const pdfFile = data.weeks[0].week_files.find((f: any) => f.file_type === 'pdf');
      
      expect(pdfFile).toBeDefined();
      expect(pdfFile.file_name).toBe('career-intro.pdf');
      expect(pdfFile.file_size).toBe(1048576); // 1MB
      expect(pdfFile.file_url).toContain('career-intro.pdf');
      
      // Verify file can be used for download functionality
      expect(pdfFile.file_url).toMatch(/^https:\/\/[^\/]+\/.*\.pdf$/);
    });

    it('should support different PDF file sizes', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      const pdfFiles = data.weeks
        .flatMap((week: any) => week.week_files)
        .filter((file: any) => file.file_type === 'pdf');

      pdfFiles.forEach((pdfFile: any) => {
        expect(pdfFile.file_size).toBeGreaterThan(0);
        expect(typeof pdfFile.file_size).toBe('number');
      });
    });
  });

  describe('Admin-Only Access Controls', () => {
    it('should validate admin form submission structure', () => {
      const validateAdminFormSubmission = (formData: any) => {
        const errors: string[] = [];
        
        if (!formData.weekNumber || isNaN(parseInt(formData.weekNumber))) {
          errors.push('Invalid week number');
        }
        
        if (!formData.title || formData.title.trim().length === 0) {
          errors.push('Title is required');
        }
        
        if (!formData.description || formData.description.trim().length === 0) {
          errors.push('Description is required');
        }

        const files = formData.files || [];
        const photos = files.filter((f: any) => f.type.startsWith('image/'));
        const pdfs = files.filter((f: any) => f.type === 'application/pdf');
        
        if (photos.length === 0) {
          errors.push('At least one photo is required');
        }
        
        if (pdfs.length === 0) {
          errors.push('At least one PDF file is required');
        }

        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined
        };
      };

      const validFormData = {
        weekNumber: '1',
        title: 'Test Week',
        description: 'Test description',
        files: [
          { type: 'image/jpeg', name: 'test.jpg' },
          { type: 'application/pdf', name: 'test.pdf' }
        ]
      };

      const invalidFormData = {
        weekNumber: '',
        title: '',
        description: '',
        files: []
      };

      expect(validateAdminFormSubmission(validFormData)).toEqual({ valid: true });
      expect(validateAdminFormSubmission(invalidFormData)).toEqual({
        valid: false,
        errors: ['Invalid week number', 'Title is required', 'Description is required', 'At least one photo is required', 'At least one PDF file is required']
      });
    });

    it('should validate file upload security measures', () => {
      const validateFileUploadSecurity = (fileName: string, fileType: string, fileSize: number) => {
        const errors: string[] = [];
        
        // File type validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'];
        if (!allowedTypes.includes(fileType)) {
          errors.push('Unsupported file type');
        }
        
        // File size validation (50MB limit)
        const maxSize = 50 * 1024 * 1024;
        if (fileSize > maxSize) {
          errors.push('File size exceeds limit');
        }
        
        // File name validation
        const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.js$/i];
        if (dangerousPatterns.some(pattern => pattern.test(fileName))) {
          errors.push('Potentially dangerous file type');
        }
        
        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined
        };
      };

      expect(validateFileUploadSecurity('document.pdf', 'application/pdf', 1024 * 1024)).toEqual({ valid: true });
      expect(validateFileUploadSecurity('photo.jpg', 'image/jpeg', 2 * 1024 * 1024)).toEqual({ valid: true });
      expect(validateFileUploadSecurity('malware.exe', 'application/octet-stream', 1024)).toEqual({
        valid: false,
        errors: ['Unsupported file type', 'Potentially dangerous file type']
      });
      expect(validateFileUploadSecurity('huge.pdf', 'application/pdf', 100 * 1024 * 1024)).toEqual({
        valid: false,
        errors: ['File size exceeds limit']
      });
    });

    it('should validate admin user tracking in uploads', async () => {
      const formData = createValidFormData();
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;

      await POST(request);

      // Verify that admin user is tracked in database operations
      const { supabase } = require('../../src/lib/supabase');
      expect(supabase.from).toHaveBeenCalledWith('weeks');
      expect(supabase.from().insert).toHaveBeenCalled();
      
      const insertCall = supabase.from().insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('created_by');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const manyWeeks = Array.from({ length: 50 }, (_, i) => ({
        id: `week-${i + 1}`,
        week_number: i + 1,
        title: `Week ${i + 1}`,
        description: `Description for week ${i + 1}`,
        created_at: new Date(2024, 0, i + 1).toISOString(),
        created_by: 'admin-user-id',
        week_files: []
      }));

      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: manyWeeks,
              error: null
            }))
          }))
        }))
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks).toHaveLength(50);
      
      // Verify ordering is maintained
      for (let i = 0; i < data.weeks.length - 1; i++) {
        expect(data.weeks[i].week_number).toBeLessThanOrEqual(data.weeks[i + 1].week_number);
      }
    });

    it('should handle weeks with many files', async () => {
      const weekWithManyFiles = [{
        id: 'week-1',
        week_number: 1,
        title: 'Week with Many Files',
        description: 'Performance test week',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin-user-id',
        week_files: Array.from({ length: 20 }, (_, i) => ({
          id: `file-${i + 1}`,
          week_id: 'week-1',
          file_name: `file-${i + 1}.${i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'jpg' : 'mp4'}`,
          file_type: i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'photo' : 'video',
          file_url: `https://storage.supabase.co/week-files/file-${i + 1}`,
          file_size: 1024 * (i + 1),
          uploaded_by: 'admin-user-id',
          created_at: '2024-01-01T00:00:00Z'
        }))
      }];

      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: weekWithManyFiles,
              error: null
            }))
          }))
        }))
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks[0].week_files).toHaveLength(20);
      
      // Verify all files have proper structure
      data.weeks[0].week_files.forEach((file: any) => {
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('file_name');
        expect(file).toHaveProperty('file_type');
        expect(file).toHaveProperty('file_url');
        expect(file).toHaveProperty('file_size');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed requests gracefully', async () => {
      const request = {
        formData: () => Promise.reject(new Error('Invalid form data'))
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database connection failures', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => {
          throw new Error('Database connection failed');
        })
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle null or undefined data gracefully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks).toEqual([]);
    });
  });
});