import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';

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
      })),
    })),
  })),
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('Login Flow', () => {
    it('should render login form with email and password fields', () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should handle successful login for admin user', async () => {
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
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      });
    });

    it('should handle successful login for student user', async () => {
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

      render(<LoginPage />);
      
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
    });

    it('should handle login error', async () => {
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
  });

  describe('Signup Flow', () => {
    it('should render signup form with required fields', () => {
      render(<SignupPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should handle successful signup', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-123', email: 'newuser@test.com' },
          session: null
        },
        error: null
      });

      render(<SignupPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'New User' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should handle signup error', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      });

      render(<SignupPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Existing User' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      render(<SignupPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.blur(passwordInput);

      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    it('should validate email format', () => {
      render(<SignupPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });
});