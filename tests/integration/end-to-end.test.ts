import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import LoginPage from '@/app/login/page';
import AdminPage from '@/app/admin/page';
import DashboardPage from '@/app/dashboard/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  getCurrentUser: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Gemini AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'This is a helpful AI response about career guidance.'
        }
      })
    })
  }))
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ 
            data: [
              { id: 1, title: 'Week 1', description: 'Career exploration' },
              { id: 2, title: 'Week 2', description: 'Skills assessment' }
            ], 
            error: null 
          }))
        }))
      }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: { path: 'test.jpg' }, error: null })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
};

describe('End-to-End User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  describe('Complete Student Journey', () => {
    it('should handle complete student signup and dashboard access flow', async () => {
      const { getCurrentUser } = require('@/lib/auth-client');
      
      // Step 1: Student signs up
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'student-123', email: 'student@test.com' },
          session: null
        },
        error: null
      });

      render(<LoginPage />);
      
      // Navigate to signup (assuming there's a signup link)
      const signupLink = screen.getByText(/sign up/i);
      fireEvent.click(signupLink);

      // Fill signup form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Test Student' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Step 2: Student confirms email and logs in
      getCurrentUser.mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Test Student' }
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'student-123', email: 'student@test.com' },
          session: { access_token: 'token' }
        },
        error: null
      });

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'student' },
        error: null
      });

      // Login
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'student@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });

      // Step 3: Access student dashboard
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/student dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/week 1/i)).toBeInTheDocument();
        expect(screen.getByText(/career exploration/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete Admin Journey', () => {
    it('should handle complete admin login and content management flow', async () => {
      const { getCurrentUser } = require('@/lib/auth-client');
      
      // Step 1: Admin logs in
      getCurrentUser.mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Test Admin' }
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@test.com' },
          session: { access_token: 'token' }
        },
        error: null
      });

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'admin@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'adminpass123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      });

      // Step 2: Access admin dashboard
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/content management/i)).toBeInTheDocument();
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
      });

      // Step 3: Manage content
      const uploadButton = screen.getByText(/upload new content/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/select files/i)).toBeInTheDocument();
      });

      // Step 4: View statistics
      expect(screen.getByText(/total students/i)).toBeInTheDocument();
      expect(screen.getByText(/schools visited/i)).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Enforcement', () => {
    it('should prevent students from accessing admin features', async () => {
      const { getCurrentUser } = require('@/lib/auth-client');
      
      getCurrentUser.mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Test Student' }
      });

      // Try to access admin page as student
      render(<AdminPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should allow admins to access both admin and student views', async () => {
      const { getCurrentUser } = require('@/lib/auth-client');
      
      getCurrentUser.mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Test Admin' }
      });

      // Admin can access admin dashboard
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      // Admin can also access student dashboard
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/student dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Chat Integration', () => {
    it('should handle complete AI chat interaction flow', async () => {
      const { getCurrentUser } = require('@/lib/auth-client');
      
      getCurrentUser.mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Test Student' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        const aiButton = screen.getByText(/ask ai/i);
        fireEvent.click(aiButton);
      });

      // AI chat should open
      await waitFor(() => {
        expect(screen.getByText(/ask me anything about careers/i)).toBeInTheDocument();
      });

      // Send a message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(messageInput, {
        target: { value: 'What career should I choose?' }
      });

      const sendButton = screen.getByText(/send/i);
      fireEvent.click(sendButton);

      // Should receive AI response
      await waitFor(() => {
        expect(screen.getByText(/helpful AI response about career guidance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle authentication failures gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should handle database connection errors', async () => {
      const { getCurrentUser } = require('@/lib/auth-client');
      
      getCurrentUser.mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Test Student' }
      });

      // Mock database error
      mockSupabaseClient.from().select().eq().order().limit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/error loading content/i)).toBeInTheDocument();
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should validate required environment variables', () => {
      const { validateEnvironmentVariables } = require('@/lib/env-validation');
      
      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
      expect(result.supabaseUrl).toBe('https://test.supabase.co');
      expect(result.supabaseAnonKey).toBe('test-anon-key');
    });

    it('should detect Vercel deployment environment', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      
      const { getVercelEnvironment } = require('@/lib/env-validation');
      const result = getVercelEnvironment();
      
      expect(result.isVercel).toBe(true);
      expect(result.environment).toBe('production');
    });
  });
});