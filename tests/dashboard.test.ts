import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
            limit: jest.fn(() => Promise.resolve({ 
              data: [
                { id: 1, title: 'Week 1', description: 'First week content' },
                { id: 2, title: 'Week 2', description: 'Second week content' }
              ], 
              error: null 
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-file.jpg' }, error: null })),
        list: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }
  }))
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

describe('Dashboard Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Admin User' }
      });
    });

    it('should display admin dashboard with all sections', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/content management/i)).toBeInTheDocument();
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
        expect(screen.getByText(/statistics/i)).toBeInTheDocument();
      });
    });

    it('should allow content upload functionality', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        const uploadButton = screen.getByText(/upload new content/i);
        expect(uploadButton).toBeInTheDocument();
        
        fireEvent.click(uploadButton);
        expect(screen.getByText(/select files/i)).toBeInTheDocument();
      });
    });

    it('should display weekly content management', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/week 1/i)).toBeInTheDocument();
        expect(screen.getByText(/week 2/i)).toBeInTheDocument();
        expect(screen.getByText(/first week content/i)).toBeInTheDocument();
      });
    });

    it('should allow editing weekly content', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        const editButton = screen.getAllByText(/edit/i)[0];
        fireEvent.click(editButton);
        
        expect(screen.getByDisplayValue(/week 1/i)).toBeInTheDocument();
      });
    });

    it('should display user statistics', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/total students/i)).toBeInTheDocument();
        expect(screen.getByText(/schools visited/i)).toBeInTheDocument();
        expect(screen.getByText(/content uploads/i)).toBeInTheDocument();
      });
    });

    it('should handle logout functionality', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        const logoutButton = screen.getByText(/logout/i);
        fireEvent.click(logoutButton);
        
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Student Dashboard', () => {
    beforeEach(() => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });
    });

    it('should display student dashboard with appropriate sections', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/student dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/weekly content/i)).toBeInTheDocument();
        expect(screen.getByText(/group chat/i)).toBeInTheDocument();
        expect(screen.getByText(/ask ai/i)).toBeInTheDocument();
      });
    });

    it('should display weekly content for students', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/week 1/i)).toBeInTheDocument();
        expect(screen.getByText(/week 2/i)).toBeInTheDocument();
        expect(screen.getByText(/first week content/i)).toBeInTheDocument();
      });
    });

    it('should not show admin controls to students', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/upload new content/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/edit/i)).not.toBeInTheDocument();
      });
    });

    it('should provide access to group chat', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const chatButton = screen.getByText(/group chat/i);
        fireEvent.click(chatButton);
        
        expect(screen.getByText(/chat with other students/i)).toBeInTheDocument();
      });
    });

    it('should provide access to AI chat', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const aiButton = screen.getByText(/ask ai/i);
        fireEvent.click(aiButton);
        
        expect(screen.getByText(/ask me anything about careers/i)).toBeInTheDocument();
      });
    });

    it('should handle logout functionality', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const logoutButton = screen.getByText(/logout/i);
        fireEvent.click(logoutButton);
        
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Dashboard Navigation', () => {
    it('should allow admin to switch between admin and student views', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        profile: { role: 'admin', full_name: 'Admin User' }
      });

      render(<AdminPage />);

      await waitFor(() => {
        const studentViewButton = screen.getByText(/student view/i);
        fireEvent.click(studentViewButton);
        
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not show admin navigation to students', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/student view/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading errors gracefully', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        user: { id: 'student-123', email: 'student@test.com' },
        profile: { role: 'student', full_name: 'Student User' }
      });

      // Mock error response
      jest.mocked(require('@supabase/supabase-js').createClient).mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ 
                  data: null, 
                  error: { message: 'Database connection failed' }
                }))
              }))
            }))
          }))
        }))
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/error loading content/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Auth failed'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });
});