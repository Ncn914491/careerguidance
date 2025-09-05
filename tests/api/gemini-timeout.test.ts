import { NextRequest } from 'next/server';
import { POST } from '@/app/api/askai/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Gemini AI
jest.mock('@google/generative-ai');
const MockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
}));

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-123' }
  }))
}));

describe('Gemini API Timeout Handling', () => {
  let mockModel: any;
  let mockGenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModel = {
      generateContent: jest.fn()
    };
    
    mockGenAI = {
      getGenerativeModel: jest.fn(() => mockModel)
    };
    
    MockGoogleGenerativeAI.mockImplementation(() => mockGenAI);
    
    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('should handle successful Gemini response', async () => {
    const mockResponse = {
      response: {
        text: () => 'This is a helpful career guidance response.'
      }
    };
    
    mockModel.generateContent.mockResolvedValue(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What career should I choose?',
        userId: 'test-user-123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe('This is a helpful career guidance response.');
    expect(data.timestamp).toBeDefined();
  });

  it('should handle Gemini API timeout', async () => {
    // Mock a slow response that exceeds timeout
    mockModel.generateContent.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
    );

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What career should I choose?',
        userId: 'test-user-123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(408); // Request Timeout
    expect(data.error).toBe('AI service error');
    expect(data.response).toContain('taking longer than expected');
  });

  it('should handle missing API key', async () => {
    delete process.env.GEMINI_API_KEY;

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What career should I choose?',
        userId: 'test-user-123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('AI service not configured');
    expect(data.response).toContain('AI service is currently unavailable');
  });

  it('should handle Gemini API authentication errors', async () => {
    mockModel.generateContent.mockRejectedValue(
      new Error('API key authentication failed')
    );

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What career should I choose?',
        userId: 'test-user-123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503); // Service Unavailable
    expect(data.error).toBe('AI service error');
    expect(data.response).toContain('currently unavailable');
  });

  it('should handle Gemini API quota exceeded', async () => {
    mockModel.generateContent.mockRejectedValue(
      new Error('Quota exceeded for requests')
    );

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What career should I choose?',
        userId: 'test-user-123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429); // Too Many Requests
    expect(data.error).toBe('AI service error');
    expect(data.response).toContain('usage limit');
  });

  it('should handle generic Gemini API errors', async () => {
    mockModel.generateContent.mockRejectedValue(
      new Error('Unknown API error')
    );

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What career should I choose?',
        userId: 'test-user-123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('AI service error');
    expect(data.response).toContain('having trouble processing');
  });

  it('should validate request payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-user-123'
        // Missing message
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message is required');
  });

  it('should use proper generation config for Gemini', async () => {
    const mockResponse = {
      response: {
        text: () => 'Response'
      }
    };
    
    mockModel.generateContent.mockResolvedValue(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test message',
        userId: 'test-user-123'
      })
    });

    await POST(request);

    expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });
  });

  it('should include proper context in prompt', async () => {
    const mockResponse = {
      response: {
        text: () => 'Response'
      }
    };
    
    mockModel.generateContent.mockResolvedValue(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/askai', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is this program about?',
        userId: 'test-user-123'
      })
    });

    await POST(request);

    const callArgs = mockModel.generateContent.mock.calls[0][0];
    expect(callArgs).toContain('Career Guidance Project Website');
    expect(callArgs).toContain('Visited 5+ schools');
    expect(callArgs).toContain('team of 11 members');
    expect(callArgs).toContain('What is this program about?');
  });
});