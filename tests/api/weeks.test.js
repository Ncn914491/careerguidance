import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../../src/app/api/weeks/route';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [
          {
            id: '1',
            week_number: 1,
            title: 'Introduction to Career Guidance',
            description: 'Overview of career opportunities in technology and engineering fields',
            created_at: '2024-01-01T00:00:00Z',
            week_files: [
              {
                id: 'f1',
                file_name: 'intro.pdf',
                file_type: 'pdf',
                file_url: 'https://example.com/intro.pdf',
                file_size: 1024,
                created_at: '2024-01-01T00:00:00Z'
              },
              {
                id: 'f2',
                file_name: 'photo1.jpg',
                file_type: 'photo',
                file_url: 'https://example.com/photo1.jpg',
                file_size: 2048,
                created_at: '2024-01-01T00:00:00Z'
              }
            ]
          },
          {
            id: '2',
            week_number: 2,
            title: 'Computer Science Fundamentals',
            description: 'Basic programming concepts',
            created_at: '2024-01-08T00:00:00Z',
            week_files: []
          }
        ],
        error: null
      })),
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

describe('/api/weeks GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return weeks with files in correct format', async () => {
    const { req } = createMocks({
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeks).toBeDefined();
    expect(Array.isArray(data.weeks)).toBe(true);
    expect(data.weeks).toHaveLength(2);
    
    // Verify first week structure
    const firstWeek = data.weeks[0];
    expect(firstWeek).toHaveProperty('id');
    expect(firstWeek).toHaveProperty('week_number', 1);
    expect(firstWeek).toHaveProperty('title', 'Introduction to Career Guidance');
    expect(firstWeek).toHaveProperty('description');
    expect(firstWeek).toHaveProperty('created_at');
    expect(firstWeek).toHaveProperty('week_files');
    expect(Array.isArray(firstWeek.week_files)).toBe(true);
    expect(firstWeek.week_files).toHaveLength(2);
    
    // Verify file structure
    const file = firstWeek.week_files[0];
    expect(file).toHaveProperty('id');
    expect(file).toHaveProperty('file_name');
    expect(file).toHaveProperty('file_type');
    expect(file).toHaveProperty('file_url');
    expect(file).toHaveProperty('file_size');
    expect(file).toHaveProperty('created_at');
  });

  it('should return weeks ordered by week_number ascending', async () => {
    const { req } = createMocks({
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeks[0].week_number).toBe(1);
    expect(data.weeks[1].week_number).toBe(2);
    
    // Verify the order call was made correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('weeks');
    expect(mockSupabase.from().select().order).toHaveBeenCalledWith('week_number', { ascending: true });
  });

  it('should handle empty weeks array', async () => {
    mockSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }));

    const { req } = createMocks({
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeks).toEqual([]);
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: null,
          error: { message: 'Database connection failed' }
        }))
      }))
    }));

    const { req } = createMocks({
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch weeks');
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from = jest.fn(() => {
      throw new Error('Unexpected error');
    });

    const { req } = createMocks({
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('/api/weeks POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default successful state
    mockSupabase.from = jest.fn(() => ({
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
    }));
    
    mockSupabase.storage = {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com/file.jpg' } }))
      }))
    };
  });

  it('should create week with valid data and files', async () => {
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    formData.append('files', photoFile);
    formData.append('files', pdfFile);

    const { req } = createMocks({
      method: 'POST',
      body: formData,
    });

    // Mock formData method
    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Week created successfully');
    expect(data.week).toBeDefined();
    expect(data.files).toBeDefined();
  });

  it('should validate required fields - missing week number', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should validate required fields - missing title', async () => {
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('description', 'Test description');

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should validate required fields - missing description', async () => {
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should validate file requirements - missing photos', async () => {
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('files', pdfFile);

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('photo');
  });

  it('should validate file requirements - missing PDFs', async () => {
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('files', photoFile);

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('PDF');
  });

  it('should prevent duplicate week numbers', async () => {
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

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('already exists');
  });

  it('should handle database errors during week creation', async () => {
    mockSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
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

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create week');
  });

  it('should handle file upload errors gracefully', async () => {
    // Mock storage upload error
    mockSupabase.storage = {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Storage error' } 
        })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com/file.jpg' } }))
      }))
    };

    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    formData.append('files', photoFile);
    formData.append('files', pdfFile);

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    // Should still succeed but with fewer files
    expect(response.status).toBe(200);
    expect(data.message).toBe('Week created successfully');
  });

  it('should handle multiple file types correctly', async () => {
    const formData = new FormData();
    formData.append('weekNumber', '1');
    formData.append('title', 'Test Week');
    formData.append('description', 'Test description');
    
    const photoFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const unsupportedFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
    
    formData.append('files', photoFile);
    formData.append('files', videoFile);
    formData.append('files', pdfFile);
    formData.append('files', unsupportedFile);

    const { req } = createMocks({
      method: 'POST',
    });

    req.formData = jest.fn().mockResolvedValue(formData);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Week created successfully');
    // Should skip unsupported file type
  });
});