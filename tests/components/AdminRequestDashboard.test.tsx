import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminRequestDashboard from '@/components/AdminRequestDashboard';

// Mock fetch
global.fetch = jest.fn();

const mockRequests = [
  {
    id: '1',
    user_id: 'user1',
    reason: 'I need admin access to help with content management',
    status: 'pending' as const,
    created_at: '2024-01-01T00:00:00Z',
    reviewed_at: null,
    profiles: {
      full_name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    user_id: 'user2',
    reason: 'Previous request that was approved',
    status: 'approved' as const,
    created_at: '2024-01-01T00:00:00Z',
    reviewed_at: '2024-01-02T00:00:00Z',
    profiles: {
      full_name: 'Jane Smith',
      email: 'jane@example.com'
    },
    reviewer: {
      full_name: 'Admin User',
      email: 'admin@example.com'
    }
  },
  {
    id: '3',
    user_id: 'user3',
    reason: 'Request that was denied',
    status: 'denied' as const,
    created_at: '2024-01-01T00:00:00Z',
    reviewed_at: '2024-01-02T00:00:00Z',
    profiles: {
      full_name: 'Bob Johnson',
      email: 'bob@example.com'
    },
    reviewer: {
      full_name: 'Admin User',
      email: 'admin@example.com'
    }
  }
];

describe('AdminRequestDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with requests', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests })
    });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Request Management')).toBeInTheDocument();
      expect(screen.getByText('Pending Requests (1)')).toBeInTheDocument();
      expect(screen.getByText('Recent Processed Requests (2)')).toBeInTheDocument();
    });

    // Check pending request
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('(john@example.com)')).toBeInTheDocument();
    expect(screen.getByText('I need admin access to help with content management')).toBeInTheDocument();

    // Check processed requests
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('shows empty state when no pending requests', async () => {
    const processedOnly = mockRequests.filter(req => req.status !== 'pending');
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: processedOnly })
    });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pending Requests (0)')).toBeInTheDocument();
      expect(screen.getByText('No pending requests')).toBeInTheDocument();
    });
  });

  it('shows empty state when no processed requests', async () => {
    const pendingOnly = mockRequests.filter(req => req.status === 'pending');
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: pendingOnly })
    });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Processed Requests (0)')).toBeInTheDocument();
      expect(screen.getByText('No processed requests')).toBeInTheDocument();
    });
  });

  it('approves request successfully', async () => {
    // Mock initial fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      // Mock approve request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Request approved successfully' })
      })
      // Mock refresh after approval
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          requests: mockRequests.map(req => 
            req.id === '1' ? { ...req, status: 'approved' as const, reviewed_at: '2024-01-03T00:00:00Z' } : req
          )
        })
      });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/requests/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Request approved successfully!')).toBeInTheDocument();
    });
  });

  it('denies request successfully', async () => {
    // Mock initial fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      // Mock deny request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Request denied successfully' })
      })
      // Mock refresh after denial
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          requests: mockRequests.map(req => 
            req.id === '1' ? { ...req, status: 'denied' as const, reviewed_at: '2024-01-03T00:00:00Z' } : req
          )
        })
      });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const denyButton = screen.getByRole('button', { name: 'Deny' });
    fireEvent.click(denyButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/requests/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny' })
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Request denied successfully!')).toBeInTheDocument();
    });
  });

  it('opens request detail modal', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests })
    });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButton = screen.getByTitle('View details');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.getAllByText('I need admin access to help with content management')).toHaveLength(2);
    });
  });

  it('closes request detail modal', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests })
    });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal
    const viewButton = screen.getByTitle('View details');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Request Details')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load admin requests')).toBeInTheDocument();
    });
  });

  it('handles approval errors gracefully', async () => {
    // Mock initial fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      // Mock failed approval
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Approval failed' })
      });

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText('Approval failed')).toBeInTheDocument();
    });
  });

  it('disables buttons while processing', async () => {
    // Mock initial fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      // Mock slow approval
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AdminRequestDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    const denyButton = screen.getByRole('button', { name: 'Deny' });
    
    fireEvent.click(approveButton);

    expect(approveButton).toBeDisabled();
    expect(denyButton).toBeDisabled();
    expect(screen.getAllByText('...')).toHaveLength(2);
  });
});