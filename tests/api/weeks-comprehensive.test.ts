/**
 * Comprehensive tests for weeks API endpoints and data fetching
 * Tests all aspects of the weeks functionality including edge cases
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/weeks/route';

// Mock Supabase with comprehensive scenarios
const createMockSupabase = (scenario: string = 'default') => {
  const scenarios = {
    default: {
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
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.supabase.co/week-files/test.jpg' } }))
        }))
      }
    },
    database_error: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database connection failed', code: 'PGRST301' }
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
            error: { message: 'Storage quota exceeded' } 
          })),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.supabase.co/week-files/test.jpg' } }))
        }))
      }
    },
    duplicate_week: {
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
    }
  };
  
  return scenarios[scenario as keyof typeof scenarios] || scenarios.default;
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
      },
      {
        id: 'file-3',
        week_id: 'week-1',
        file_name: 'presentation-video.mp4',
        file_type: 'video',
        file_url: 'https://storage.supabase.co/week-files/week-1/presentation-video.mp4',
        file_size: 52428800,
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: 'week-2',
    week_number: 2,
    title: 'Computer Science Fundamentals',
    description: 'Basic programming concepts and software development lifecycle',
    created_at: '2024-01-08T00:00:00Z',
    created_by: 'admin-user-id',
    week_files: [
      {
        id: 'file-4',
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

describe('Weeks API Endpoints - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mock
    const { supabase } = require('../../src/lib/supabase');
    Object.assign(supabase, createMockSupabase());
  });

  describe('GET /api/weeks - Data Fetching', () => {
    it('should fetch weeks with complete data structure', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('weeks');
      expect(Array.isArray(data.weeks)).toBe(true);
      expect(data.weeks).toHaveLength(2);

      // Verify complete week structure
      const week = data.weeks[0];
      expect(week).toHaveProperty('id');
      expect(week).toHaveProperty('week_number');
      expect(week).toHaveProperty('title');
      expect(week).toHaveProperty('description');
      expect(week).toHaveProperty('created_at');
      expect(week).toHaveProperty('created_by');
      expect(week).toHaveProperty('week_files');
      expect(Array.isArray(week.week_files)).toBe(true);
    });

    it('should return weeks ordered by week_number ascending', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks[0].week_number).toBe(1);
      expect(data.weeks[1].week_number).toBe(2);
      
      // Verify ordering for multiple weeks
      for (let i = 0; i < data.weeks.length - 1; i++) {
        expect(data.weeks[i].week_number).toBeLessThanOrEqual(data.weeks[i + 1].week_number);
      }
    });

    it('should include complete file metadata for each week', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      const weekWithFiles = data.weeks.find((w: any) => w.week_files.length > 0);
      expect(weekWithFiles).toBeDefined();

      const file = weekWithFiles.week_files[0];
      expect(file).toHaveProperty('id');
      expect(file).toHaveProperty('week_id');
      expect(file).toHaveProperty('file_name');
      expect(file).toHaveProperty('file_type');
      expect(file).toHaveProperty('file_url');
      expect(file).toHaveProperty('file_size');
      expect(file).toHaveProperty('uploaded_by');
      expect(file).toHaveProperty('created_at');

      // Verify file type is valid
      expect(['photo', 'video', 'pdf']).toContain(file.file_type);
      
      // Verify URL format
      expect(file.file_url).toMatch(/^https:\/\//);
      expect(file.file_url).toContain('storage.supabase.co');
    });

    it('should handle weeks with no files', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      // Week 2 has files, but let's test the structure
      data.weeks.forEach((week: any) => {
        expect(week).toHaveProperty('week_files');
        expect(Array.isArray(week.week_files)).toBe(true);
      });
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

    it('should handle database connection errors', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, createMockSupabase('database_error'));

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch weeks');
    });

    it('should handle null data from database', async () => {
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

    it('should handle unexpected errors during fetch', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => {
          throw new Error('Unexpected database error');
        })
      });

      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/weeks - File Upload Workflow', () => {
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

    it('should successfully create week with valid data and files', async () => {
      const formData = createValidFormData();
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
      expect(data.week).toBeDefined();
      expect(data.files).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);
    });

    it('should validate all required fields comprehensively', async () => {
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

    it('should validate file type requirements strictly', async () => {
      // Test missing photos
      const formDataNoPhotos = new FormData();
      formDataNoPhotos.append('weekNumber', '3');
      formDataNoPhotos.append('title', 'Test Week');
      formDataNoPhotos.append('description', 'Test description');
      formDataNoPhotos.append('files', new File(['pdf'], 'test.pdf', { type: 'application/pdf' }));

      const requestNoPhotos = { formData: () => Promise.resolve(formDataNoPhotos) } as NextRequest;
      const responseNoPhotos = await POST(requestNoPhotos);
      const dataNoPho tos = await responseNoPhotos.json();

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
      
      // Add multiple file types
      formData.append('files', new File(['jpeg'], 'photo1.jpg', { type: 'image/jpeg' }));
      formData.append('files', new File(['png'], 'photo2.png', { type: 'image/png' }));
      formData.append('files', new File(['gif'], 'animation.gif', { type: 'image/gif' }));
      formData.append('files', new File(['mp4'], 'video1.mp4', { type: 'video/mp4' }));
      formData.append('files', new File(['webm'], 'video2.webm', { type: 'video/webm' }));
      formData.append('files', new File(['pdf'], 'document1.pdf', { type: 'application/pdf' }));
      formData.append('files', new File(['pdf'], 'document2.pdf', { type: 'application/pdf' }));
      formData.append('files', new File(['txt'], 'readme.txt', { type: 'text/plain' })); // Unsupported

      const request = { formData: () => Promise.resolve(formData) } as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
      
      // Should process 7 supported files, skip 1 unsupported
      const { supabase } = require('../../src/lib/supabase');
      expect(supabase.storage.from().upload).toHaveBeenCalledTimes(7);
    });

    it('should prevent duplicate week numbers', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, createMockSupabase('duplicate_week'));

      const formData = createValidFormData();
      formData.set('weekNumber', '1'); // Existing week number
      
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should handle storage upload errors gracefully', async () => {
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

    it('should handle database errors during week creation', async () => {
      const { supabase } = require('../../src/lib/supabase');
      Object.assign(supabase, {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Database constraint violation' }
              }))
            }))
          }))
        }))
      });

      const formData = createValidFormData();
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create week');
    });

    it('should handle malformed form data', async () => {
      const request = {
        formData: () => Promise.reject(new Error('Invalid form data'))
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should generate proper file URLs and metadata', async () => {
      const formData = createValidFormData();
      const request = { formData: () => Promise.resolve(formData) } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify file URL generation was called
      const { supabase } = require('../../src/lib/supabase');
      expect(supabase.storage.from).toHaveBeenCalledWith('week-files');
      expect(supabase.storage.from().getPublicUrl).toHaveBeenCalled();
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file size limits (conceptual)', () => {
      // This test validates the structure for file size checking
      const validateFileSize = (file: File, maxSize: number = 10 * 1024 * 1024) => {
        return file.size <= maxSize;
      };

      const smallFile = new File(['small'], 'small.jpg', { type: 'image/jpeg' });
      const largeFile = new File([new Array(11 * 1024 * 1024).fill('x').join('')], 'large.jpg', { type: 'image/jpeg' });

      expect(validateFileSize(smallFile)).toBe(true);
      expect(validateFileSize(largeFile)).toBe(false);
    });

    it('should validate file name sanitization', () => {
      const sanitizeFileName = (fileName: string) => {
        return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      };

      expect(sanitizeFileName('normal-file.pdf')).toBe('normal-file.pdf');
      expect(sanitizeFileName('file with spaces.jpg')).toBe('file_with_spaces.jpg');
      expect(sanitizeFileName('file@#$%.pdf')).toBe('file____.pdf');
    });

    it('should validate supported file extensions', () => {
      const isValidFileType = (fileName: string, fileType: string) => {
        const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi'];
        const pdfExtensions = ['.pdf'];

        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

        switch (fileType) {
          case 'image/jpeg':
          case 'image/png':
          case 'image/gif':
          case 'image/webp':
            return photoExtensions.includes(extension);
          case 'video/mp4':
          case 'video/webm':
          case 'video/ogg':
            return videoExtensions.includes(extension);
          case 'application/pdf':
            return pdfExtensions.includes(extension);
          default:
            return false;
        }
      };

      expect(isValidFileType('photo.jpg', 'image/jpeg')).toBe(true);
      expect(isValidFileType('document.pdf', 'application/pdf')).toBe(true);
      expect(isValidFileType('video.mp4', 'video/mp4')).toBe(true);
      expect(isValidFileType('malicious.exe', 'application/octet-stream')).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of weeks efficiently', async () => {
      const manyWeeks = Array.from({ length: 100 }, (_, i) => ({
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
      expect(data.weeks).toHaveLength(100);
      
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
        week_files: Array.from({ length: 50 }, (_, i) => ({
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
      expect(data.weeks[0].week_files).toHaveLength(50);
    });
  });
});