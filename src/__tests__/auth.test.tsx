import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { useAuthStore } from '@/store/authStore';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(),
      upsert: jest.fn()
    }))
  }
}));

// Mock auth store
jest.mock('@/store/authStore');

// Test component to access auth context
function TestComponent() {
  const { user, isAdmin, isLoading, isInitialized } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user?.email || 'No user'}</div>
      <div data-testid="isAdmin">{isAdmin ? 'Admin' : 'Not admin'}</div>
      <div data-testid="isLoading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="isInitialized">{isInitialized ? 'Initialized' : 'Not initialized'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock auth store
    (useAuthStore as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      isAdmin: false,
      isLoading: true,
      isInitialized: false,
      setUser: jest.fn(),
      setSession: jest.fn(),
      setIsAdmin: jest.fn(),
      setIsLoading: jest.fn(),
      setIsInitialized: jest.fn()
    });
  });

  it('should render loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('isLoading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('isInitialized')).toHaveTextContent('Not initialized');
  });

  it('should handle no user session', async () => {
    const { supabase } = require('@/lib/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('Not admin');
    });
  });

  it('should handle user session with student role', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'student@test.com'
    };
    
    const mockSession = {
      user: mockUser,
      access_token: 'token-123'
    };

    const { supabase } = require('@/lib/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'student' },
            error: null
          })
        }))
      }))
    });

    // Update mock store to return user data
    (useAuthStore as jest.Mock).mockReturnValue({
      user: mockUser,
      session: mockSession,
      isAdmin: false,
      isLoading: false,
      isInitialized: true,
      setUser: jest.fn(),
      setSession: jest.fn(),
      setIsAdmin: jest.fn(),
      setIsLoading: jest.fn(),
      setIsInitialized: jest.fn()
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('student@test.com');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('Not admin');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('isInitialized')).toHaveTextContent('Initialized');
    });
  });

  it('should handle user session with admin role', async () => {
    const mockUser = {
      id: 'admin-123',
      email: 'admin@test.com'
    };
    
    const mockSession = {
      user: mockUser,
      access_token: 'admin-token-123'
    };

    const { supabase } = require('@/lib/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null
          })
        }))
      }))
    });

    // Update mock store to return admin data
    (useAuthStore as jest.Mock).mockReturnValue({
      user: mockUser,
      session: mockSession,
      isAdmin: true,
      isLoading: false,
      isInitialized: true,
      setUser: jest.fn(),
      setSession: jest.fn(),
      setIsAdmin: jest.fn(),
      setIsLoading: jest.fn(),
      setIsInitialized: jest.fn()
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('admin@test.com');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('Admin');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('isInitialized')).toHaveTextContent('Initialized');
    });
  });
});

describe('Authentication API', () => {
  it('should create admin user successfully', async () => {
    // Mock fetch for API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Admin user created successfully',
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          role: 'admin'
        }
      })
    });

    const response = await fetch('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123',
        fullName: 'Test Admin'
      })
    });

    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.user.role).toBe('admin');
    expect(data.user.email).toBe('admin@test.com');
  });

  it('should fetch weeks data', async () => {
    const mockWeeksData = {
      weeks: [
        {
          id: 'week-1',
          week_number: 1,
          title: 'Introduction to Career Guidance',
          description: 'First week content',
          week_files: []
        }
      ]
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWeeksData)
    });

    const response = await fetch('/api/weeks');
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.weeks).toHaveLength(1);
    expect(data.weeks[0].week_number).toBe(1);
  });
});