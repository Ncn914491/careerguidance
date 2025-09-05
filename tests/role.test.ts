import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminPage from '@/app/admin/page';
import DashboardPage from '@/app/dashboard/page';
import { getCurrentUser } from '@/lib/auth-client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

describe('Role-Based Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Admin Access', () => {
    it('should allow admin users to access admin dashboard', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Admin User' }
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });
    });

    it('should show admin-specific features', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Admin User' }
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/upload content/i)).toBeInTheDocument();
        expect(screen.getByText(/manage users/i)).toBeInTheDocument();
        expect(screen.getByText(/view statistics/i)).toBeInTheDocument();
      });
    });

    it('should redirect non-admin users from admin pages', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect unauthenticated users to login', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: null,
        profile: null
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Student Access', () => {
    it('should allow student users to access student dashboard', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/student dashboard/i)).toBeInTheDocument();
      });
    });

    it('should show student-specific features', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/weekly content/i)).toBeInTheDocument();
        expect(screen.getByText(/group chat/i)).toBeInTheDocument();
        expect(screen.getByText(/ask ai/i)).toBeInTheDocument();
      });
    });

    it('should not show admin features to students', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/upload content/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/manage users/i)).not.toBeInTheDocument();
      });
    });

    it('should redirect unauthenticated users to login', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: null,
        profile: null
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Role Validation', () => {
    it('should handle users with no role assigned', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'user@test.com' },
        profile: { role: null, full_name: 'User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/account setup required/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid role values', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'user@test.com' },
        profile: { role: 'invalid_role', full_name: 'User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle pending admin role', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'user@test.com' },
        profile: { role: 'pending_admin', full_name: 'Pending Admin' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/admin access pending approval/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Guards', () => {
    it('should prevent direct URL access to admin pages for students', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      // Simulate direct navigation to admin page
      render(<AdminPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should allow admin users to access all pages', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Admin User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/student dashboard/i)).toBeInTheDocument();
      });
    });
  });
});