/**
 * Integration test for admin upload functionality
 * Tests the complete flow from form submission to API processing
 */

import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/weeks/route';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: { id: 'test-week-id', week_number: 1, title: 'Test Week' },
          error: null
        }))
      }))
    }))
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com/file.jpg' } }))
    }))
  }
};

jest.mock('../../src/lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('Admin Upload Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle complete upload workflow', async () => {
    // Create mock form data
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    // Create mock files
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    formData.append('files', photoFile);
    formData.append('files', pdfFile);

    // Create mock request
    const request = {
      formData: () => Promise.resolve(formData)
    } as NextRequest;

    // Call the API route
    const response = await POST(request);
    const result = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(result.message).toBe('Week created successfully');
    expect(result.week).toBeDefined();
    expect(result.files).toBeDefined();

    // Verify Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('weeks');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('week-files');
  });

  it('should validate required fields', async () => {
    // Create incomplete form data
    const formData = new FormData();
    formData.append('weekNumber', '1');
    // Missing title and description

    const request = {
      formData: () => Promise.resolve(formData)
    } as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('required');
  });

  it('should validate file requirements', async () => {
    // Create form data without required files
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    // Only add a photo, missing PDF
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('files', photoFile);

    const request = {
      formData: () => Promise.resolve(formData)
    } as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('PDF');
  });

  it('should handle duplicate week numbers', async () => {
    // Mock existing week
    mockSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'existing-week' }, 
            error: null 
          }))
        }))
      }))
    }));

    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    formData.append('files', photoFile);
    formData.append('files', pdfFile);

    const request = {
      formData: () => Promise.resolve(formData)
    } as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('already exists');
  });
});

describe('Admin Form Validation', () => {
  it('should validate week number format', () => {
    const validateWeekNumber = (value: string) => {
      if (!value.trim()) return 'Week number is required';
      if (isNaN(parseInt(value)) || parseInt(value) < 1) {
        return 'Week number must be a positive number';
      }
      return null;
    };

    expect(validateWeekNumber('')).toBe('Week number is required');
    expect(validateWeekNumber('0')).toBe('Week number must be a positive number');
    expect(validateWeekNumber('-1')).toBe('Week number must be a positive number');
    expect(validateWeekNumber('abc')).toBe('Week number must be a positive number');
    expect(validateWeekNumber('1')).toBeNull();
    expect(validateWeekNumber('10')).toBeNull();
  });

  it('should validate file types and requirements', () => {
    const validateFiles = (files: File[]) => {
      const errors: string[] = [];
      
      const photos = files.filter(f => f.type.startsWith('image/'));
      const pdfs = files.filter(f => f.type === 'application/pdf');
      
      if (photos.length === 0) {
        errors.push('At least one photo is required');
      }
      
      if (pdfs.length === 0) {
        errors.push('At least one PDF file is required');
      }
      
      return errors;
    };

    const photoFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const textFile = new File([''], 'test.txt', { type: 'text/plain' });

    expect(validateFiles([])).toEqual([
      'At least one photo is required',
      'At least one PDF file is required'
    ]);

    expect(validateFiles([photoFile])).toEqual([
      'At least one PDF file is required'
    ]);

    expect(validateFiles([pdfFile])).toEqual([
      'At least one photo is required'
    ]);

    expect(validateFiles([photoFile, pdfFile])).toEqual([]);
    expect(validateFiles([photoFile, pdfFile, textFile])).toEqual([]);
  });
});