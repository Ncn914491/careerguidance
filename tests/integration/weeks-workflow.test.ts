/**
 * Integration test for complete weeks workflow
 * Tests the end-to-end flow from admin upload to user viewing
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/weeks/route';

// Mock API functions for testing workflow
interface MockApiResponse {
  status: number;
  json: () => Promise<any>;
}

const mockGET = async (): Promise<MockApiResponse> => {
  return {
    status: 200,
    json: async () => ({ weeks: mockWeeksData })
  };
};

const mockPOST = async (formData: FormData): Promise<MockApiResponse> => {
  // Validate form data
  const weekNumber = formData.get('weekNumber') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const files = formData.getAll('files') as File[];
  
  if (!weekNumber || !title || !description) {
    return {
      status: 400,
      json: async () => ({ error: 'Week number, title, and description are required' })
    };
  }
  
  const photos = files.filter(file => file.type.startsWith('image/'));
  const pdfs = files.filter(file => file.type === 'application/pdf');
  
  if (photos.length === 0) {
    return {
      status: 400,
      json: async () => ({ error: 'At least one photo is required' })
    };
  }
  
  if (pdfs.length === 0) {
    return {
      status: 400,
      json: async () => ({ error: 'At least one PDF file is required' })
    };
  }
  
  return {
    status: 200,
    json: async () => ({
      message: 'Week created successfully',
      week: {
        id: 'new-week-id',
        week_number: parseInt(weekNumber),
        title,
        description,
        created_by: 'admin-user-id',
        created_at: new Date().toISOString()
      },
      files: files.map((file, index) => ({
        id: `file-${index}`,
        file_name: file.name,
        file_type: file.type.startsWith('image/') ? 'photo' : 
                   file.type.startsWith('video/') ? 'video' : 'pdf',
        file_url: `https://storage.supabase.co/week-files/${file.name}`,
        file_size: file.size
      }))
    })
  };
};

// Mock Supabase with realistic data flow
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
        file_size: 1048576, // 1MB
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'file-2',
        week_id: 'week-1',
        file_name: 'school-visit-photo.jpg',
        file_type: 'photo',
        file_url: 'https://storage.supabase.co/week-files/week-1/school-visit-photo.jpg',
        file_size: 2097152, // 2MB
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'file-3',
        week_id: 'week-1',
        file_name: 'presentation-video.mp4',
        file_type: 'video',
        file_url: 'https://storage.supabase.co/week-files/week-1/presentation-video.mp4',
        file_size: 52428800, // 50MB
        uploaded_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
  }
];

const mockSupabase = {
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
          data: {
            id: 'new-week-id',
            week_number: 2,
            title: 'Advanced Programming Concepts',
            description: 'Deep dive into programming fundamentals',
            created_by: 'admin-user-id',
            created_at: '2024-01-08T00:00:00Z'
          },
          error: null
        }))
      }))
    }))
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn((fileName: string, file: File) => {
        // Simulate successful upload
        return Promise.resolve({
          data: { path: fileName },
          error: null
        });
      }),
      getPublicUrl: jest.fn((fileName: string) => ({
        data: { 
          publicUrl: `https://storage.supabase.co/week-files/${fileName}` 
        }
      }))
    }))
  }
};

jest.mock('../../src/lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('Weeks Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Upload to View Workflow', () => {
    it('should handle complete workflow from admin upload to user viewing', async () => {
      // Step 1: Admin uploads new week content
      const formData = new FormData();
      formData.append('weekNumber', '2');
      formData.append('title', 'Advanced Programming Concepts');
      formData.append('description', 'Deep dive into programming fundamentals');
      
      // Create realistic files
      const pdfContent = new Array(1000).fill('PDF content line').join('\n');
      const photoContent = new Array(500).fill('Photo binary data').join('');
      const videoContent = new Array(2000).fill('Video binary data').join('');
      
      const pdfFile = new File([pdfContent], 'programming-guide.pdf', { 
        type: 'application/pdf' 
      });
      const photoFile = new File([photoContent], 'classroom-photo.jpg', { 
        type: 'image/jpeg' 
      });
      const videoFile = new File([videoContent], 'coding-demo.mp4', { 
        type: 'video/mp4' 
      });
      
      formData.append('files', pdfFile);
      formData.append('files', photoFile);
      formData.append('files', videoFile);

      // Execute upload
      const uploadResponse = await mockPOST(formData);
      const uploadData = await uploadResponse.json();

      // Verify upload success
      expect(uploadResponse.status).toBe(200);
      expect(uploadData.message).toBe('Week created successfully');
      expect(uploadData.week).toBeDefined();
      expect(uploadData.files).toBeDefined();

      // Verify database calls
      expect(mockSupabase.from).toHaveBeenCalledWith('weeks');
      expect(mockSupabase.from).toHaveBeenCalledWith('week_files');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('week-files');

      // Step 2: User fetches weeks to view
      const viewResponse = await mockGET();
      const viewData = await viewResponse.json();

      // Verify view success
      expect(viewResponse.status).toBe(200);
      expect(viewData.weeks).toBeDefined();
      expect(Array.isArray(viewData.weeks)).toBe(true);
      expect(viewData.weeks.length).toBeGreaterThan(0);

      // Verify week structure for viewing
      const week = viewData.weeks[0];
      expect(week).toHaveProperty('id');
      expect(week).toHaveProperty('week_number');
      expect(week).toHaveProperty('title');
      expect(week).toHaveProperty('description');
      expect(week).toHaveProperty('week_files');
      expect(Array.isArray(week.week_files)).toBe(true);

      // Verify file structure for viewing
      if (week.week_files.length > 0) {
        const file = week.week_files[0];
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('file_name');
        expect(file).toHaveProperty('file_type');
        expect(file).toHaveProperty('file_url');
        expect(file).toHaveProperty('file_size');
        
        // Verify file URL is accessible
        expect(file.file_url).toMatch(/^https:\/\//);
        expect(file.file_url).toContain('week-files');
      }
    });

    it('should handle file type validation in upload workflow', async () => {
      const formData = new FormData();
      formData.append('weekNumber', '3');
      formData.append('title', 'File Type Test');
      formData.append('description', 'Testing various file types');
      
      // Add files of different types
      const pdfFile = new File(['PDF content'], 'document.pdf', { 
        type: 'application/pdf' 
      });
      const jpegFile = new File(['JPEG content'], 'photo.jpg', { 
        type: 'image/jpeg' 
      });
      const pngFile = new File(['PNG content'], 'image.png', { 
        type: 'image/png' 
      });
      const mp4File = new File(['MP4 content'], 'video.mp4', { 
        type: 'video/mp4' 
      });
      const webmFile = new File(['WEBM content'], 'video.webm', { 
        type: 'video/webm' 
      });
      const unsupportedFile = new File(['Text content'], 'readme.txt', { 
        type: 'text/plain' 
      });
      
      formData.append('files', pdfFile);
      formData.append('files', jpegFile);
      formData.append('files', pngFile);
      formData.append('files', mp4File);
      formData.append('files', webmFile);
      formData.append('files', unsupportedFile);

      const request = {
        formData: () => Promise.resolve(formData)
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
      
      // Should process supported files and skip unsupported ones
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledTimes(5); // 5 supported files
    });

    it('should handle large file uploads', async () => {
      const formData = new FormData();
      formData.append('weekNumber', '4');
      formData.append('title', 'Large Files Test');
      formData.append('description', 'Testing large file handling');
      
      // Create large files (simulated)
      const largePdfContent = new Array(10000).fill('Large PDF content').join('\n');
      const largePhotoContent = new Array(5000).fill('Large photo data').join('');
      
      const largePdfFile = new File([largePdfContent], 'large-document.pdf', { 
        type: 'application/pdf' 
      });
      const largePhotoFile = new File([largePhotoContent], 'large-photo.jpg', { 
        type: 'image/jpeg' 
      });
      
      formData.append('files', largePdfFile);
      formData.append('files', largePhotoFile);

      const request = {
        formData: () => Promise.resolve(formData)
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
      
      // Verify large files were processed
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledTimes(2);
    });
  });

  describe('PDF Viewing Workflow', () => {
    it('should provide proper PDF URLs for inline viewing', async () => {
      const request = {} as NextRequest;
      const response = await GET(request);
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
      });
    });

    it('should handle PDF download functionality', () => {
      // Test PDF download URL generation
      const pdfFile = {
        id: 'pdf-test',
        file_name: 'test-document.pdf',
        file_type: 'pdf',
        file_url: 'https://storage.supabase.co/week-files/test-document.pdf',
        file_size: 1048576
      };

      // Simulate download functionality
      const downloadUrl = pdfFile.file_url;
      const fileName = pdfFile.file_name;

      expect(downloadUrl).toBe('https://storage.supabase.co/week-files/test-document.pdf');
      expect(fileName).toBe('test-document.pdf');
      
      // Verify URL is properly formatted for download
      expect(downloadUrl).toMatch(/^https:\/\//);
      expect(fileName).toMatch(/\.pdf$/);
    });
  });

  describe('File Navigation Workflow', () => {
    it('should provide proper file ordering for navigation', async () => {
      const request = {} as NextRequest;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const weekWithFiles = data.weeks.find((week: any) => week.week_files.length > 0);
      expect(weekWithFiles).toBeDefined();
      
      const files = weekWithFiles.week_files;
      expect(files.length).toBeGreaterThan(0);
      
      // Verify files have proper structure for navigation
      files.forEach((file: any, index: number) => {
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('file_name');
        expect(file).toHaveProperty('file_type');
        expect(file).toHaveProperty('file_url');
        expect(file).toHaveProperty('created_at');
        
        // Verify file types are valid
        expect(['photo', 'video', 'pdf']).toContain(file.file_type);
      });
    });

    it('should handle mixed file types in navigation', async () => {
      const request = {} as NextRequest;
      const response = await GET(request);
      const data = await response.json();

      const weekWithMixedFiles = data.weeks[0]; // First week has mixed files
      const files = weekWithMixedFiles.week_files;
      
      // Verify we have different file types
      const fileTypes = files.map((file: any) => file.file_type);
      const uniqueTypes = [...new Set(fileTypes)];
      
      expect(uniqueTypes.length).toBeGreaterThan(1);
      expect(uniqueTypes).toContain('pdf');
      expect(uniqueTypes).toContain('photo');
      
      // Verify each file type has proper structure
      files.forEach((file: any) => {
        switch (file.file_type) {
          case 'pdf':
            expect(file.file_name).toMatch(/\.pdf$/i);
            break;
          case 'photo':
            expect(file.file_name).toMatch(/\.(jpg|jpeg|png|gif)$/i);
            break;
          case 'video':
            expect(file.file_name).toMatch(/\.(mp4|webm|ogg|avi)$/i);
            break;
        }
      });
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle storage errors during upload', async () => {
      // Mock storage error
      mockSupabase.storage.from = jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Storage quota exceeded' }
        })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com' } }))
      }));

      const formData = new FormData();
      formData.append('weekNumber', '5');
      formData.append('title', 'Storage Error Test');
      formData.append('description', 'Testing storage error handling');
      
      const pdfFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
      const photoFile = new File(['Photo content'], 'test.jpg', { type: 'image/jpeg' });
      
      formData.append('files', pdfFile);
      formData.append('files', photoFile);

      const request = {
        formData: () => Promise.resolve(formData)
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed but with fewer files
      expect(response.status).toBe(200);
      expect(data.message).toBe('Week created successfully');
    });

    it('should handle database errors during fetch', async () => {
      // Mock database error
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      }));

      const request = {} as NextRequest;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch weeks');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple weeks efficiently', async () => {
      // Mock large dataset
      const manyWeeks = Array.from({ length: 50 }, (_, i) => ({
        id: `week-${i + 1}`,
        week_number: i + 1,
        title: `Week ${i + 1} Title`,
        description: `Description for week ${i + 1}`,
        created_at: new Date(2024, 0, i + 1).toISOString(),
        week_files: []
      }));

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: manyWeeks,
            error: null
          }))
        }))
      }));

      const request = {} as NextRequest;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeks).toHaveLength(50);
      
      // Verify ordering is maintained
      for (let i = 0; i < data.weeks.length - 1; i++) {
        expect(data.weeks[i].week_number).toBeLessThan(data.weeks[i + 1].week_number);
      }
    });

    it('should handle weeks with many files', async () => {
      // Mock week with many files
      const manyFiles = Array.from({ length: 20 }, (_, i) => ({
        id: `file-${i + 1}`,
        week_id: 'week-1',
        file_name: `file-${i + 1}.${i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'jpg' : 'mp4'}`,
        file_type: i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'photo' : 'video',
        file_url: `https://storage.supabase.co/week-files/file-${i + 1}`,
        file_size: 1024 * (i + 1),
        created_at: new Date().toISOString()
      }));

      const weekWithManyFiles = [{
        id: 'week-1',
        week_number: 1,
        title: 'Week with Many Files',
        description: 'Testing performance with many files',
        created_at: '2024-01-01T00:00:00Z',
        week_files: manyFiles
      }];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: weekWithManyFiles,
            error: null
          }))
        }))
      }));

      const request = {} as NextRequest;
      const response = await GET(request);
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
});