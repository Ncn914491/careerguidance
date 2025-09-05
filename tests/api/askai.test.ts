import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

const { getCurrentUser } = require('@/lib/auth');

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'chat-123',
            user_id: 'user-123',
            message: 'Test message',
            response: 'Test response',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          error: null
        }))
      }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [{
            id: 'chat-123',
            message: 'Test message',
            response: 'Test response',
            created_at: new Date().toISOString()
          }],
          error: null
        }))
      })),
      single: jest.fn(() => Promise.resolve({
        data: {
          id: 'chat-123',
          message: 'Test message',
          response: 'Test response'
        },
        error: null
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  })),
  auth: {
    admin: {
      createUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })),
      deleteUser: jest.fn(() => Promise.resolve({ error: null }))
    }
  }
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock Gemini AI API
const mockGeminiResponse = {
  response: {
    text: () => 'This is a mock AI response to your question about career guidance.'
  }
};

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue(mockGeminiResponse)
    })
  }))
}));

// Mock fetch for API testing
global.fetch = jest.fn();

describe('AskAI API Integration', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/askai', () => {
    it('should process AI chat request and store conversation', async () => {
      // Mock authenticated user
      getCurrentUser.mockResolvedValue({
        user: { id: testUserId, email: 'test-student@example.com' },
        isAdmin: false
      });

      const testMessage = 'What career opportunities are available in software engineering?';

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          response: 'This is a mock AI response to your question about career guidance.',
          chatId: 'chat-123'
        })
      });

      const response = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.response).toBeDefined();
      expect(data.response).toBe('This is a mock AI response to your question about career guidance.');
      expect(data.chatId).toBeDefined();
    });

    it('should reject empty messages', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Message is required' })
      });

      const response = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Message is required');
    });

    it('should reject unauthenticated requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const response = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle AI API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to process AI request' })
      });

      const response = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' })
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to process AI request');
    });

    it('should set proper expiry date for chat storage', async () => {
      const testMessage = 'How do I prepare for technical interviews?';
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          response: 'Mock response',
          chatId: 'chat-123',
          expiresAt: expiryDate.toISOString()
        })
      });

      const response = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage })
      });

      const data = await response.json();
      const daysDifference = Math.round((new Date(data.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDifference).toBe(30);
    });
  });

  describe('GET /api/askai', () => {
    it('should return user chat history', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          user_id: testUserId,
          message: 'How do I become a data scientist?',
          response: 'To become a data scientist, you need skills in statistics, programming, and domain expertise.',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'chat-2',
          user_id: testUserId,
          message: 'What is software engineering?',
          response: 'Software engineering is the systematic approach to designing, developing, and maintaining software systems.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ chats: mockChats })
      });

      const response = await fetch('/api/askai');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.chats).toBeDefined();
      expect(data.chats).toHaveLength(2);
      
      // Verify chats are ordered by creation date (newest first)
      expect(data.chats[0].message).toBe('How do I become a data scientist?');
      expect(data.chats[1].message).toBe('What is software engineering?');
    });

    it('should only return chats for authenticated user', async () => {
      const userChats = [
        { id: 'chat-1', user_id: testUserId, message: 'My chat 1' },
        { id: 'chat-2', user_id: testUserId, message: 'My chat 2' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ chats: userChats })
      });

      const response = await fetch('/api/askai');
      const data = await response.json();

      // Should only see own chats
      expect(data.chats).toHaveLength(2);
      expect(data.chats.every((chat: any) => chat.user_id === testUserId)).toBe(true);
    });

    it('should not return expired chats', async () => {
      const validChats = [
        {
          id: 'chat-1',
          user_id: testUserId,
          message: 'Valid chat',
          response: 'This should be visible',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ chats: validChats })
      });

      const response = await fetch('/api/askai');
      const data = await response.json();

      // Should only see non-expired chats
      expect(data.chats).toHaveLength(1);
      expect(data.chats[0].message).toBe('Valid chat');
    });

    it('should reject unauthenticated requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const response = await fetch('/api/askai');
      expect(response.status).toBe(401);
    });
  });

  describe('Chat Storage and Expiry', () => {
    it('should automatically clean up expired chats', async () => {
      const validChats = [
        {
          id: 'chat-1',
          user_id: testUserId,
          message: 'Valid chat',
          response: 'This should remain',
          expires_at: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          chats: validChats,
          cleanupInfo: { expiredChatsRemoved: 1 }
        })
      });

      const response = await fetch('/api/askai/cleanup');
      const data = await response.json();

      expect(data.chats).toHaveLength(1);
      expect(data.chats[0].message).toBe('Valid chat');
      expect(data.cleanupInfo.expiredChatsRemoved).toBe(1);
    });

    it('should handle large chat history efficiently', async () => {
      const manyChats = Array.from({ length: 50 }, (_, i) => ({
        id: `chat-${i + 1}`,
        user_id: testUserId,
        message: `Test message ${i + 1}`,
        response: `Test response ${i + 1}`,
        created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
      }));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ chats: manyChats })
      });

      const response = await fetch('/api/askai');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chats).toHaveLength(50);
      
      // Verify ordering (newest first)
      for (let i = 0; i < data.chats.length - 1; i++) {
        const current = new Date(data.chats[i].created_at);
        const next = new Date(data.chats[i + 1].created_at);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });
});