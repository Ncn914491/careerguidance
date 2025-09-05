import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminRequestForm from '@/components/AdminRequestForm';

// Mock fetch
global.fetch = jest.fn();

describe('AdminRequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form when no existing request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [] })
    });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByText('Request Admin Access')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Request' })).toBeInTheDocument();
    });
  });

  it('shows existing pending request status', async () => {
    const mockRequest = {
      id: '1',
      reason: 'I need admin access',
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      reviewed_at: null
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [mockRequest] })
    });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByText('pending Request')).toBeInTheDocument();
      expect(screen.getByText('I need admin access')).toBeInTheDocument();
      expect(screen.getByText(/You have a pending admin request/)).toBeInTheDocument();
    });
  });

  it('shows existing approved request status', async () => {
    const mockRequest = {
      id: '1',
      reason: 'I need admin access',
      status: 'approved',
      created_at: '2024-01-01T00:00:00Z',
      reviewed_at: '2024-01-02T00:00:00Z'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [mockRequest] })
    });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByText(/approved.*Request/i)).toBeInTheDocument();
      expect(screen.getByText('I need admin access')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
    });
  });

  it('shows existing denied request and allows new submission', async () => {
    const mockRequest = {
      id: '1',
      reason: 'Previous request',
      status: 'denied',
      created_at: '2024-01-01T00:00:00Z',
      reviewed_at: '2024-01-02T00:00:00Z'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [mockRequest] })
    });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByText(/denied.*Request/i)).toBeInTheDocument();
      expect(screen.getByText('Previous request')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Request' })).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    // Mock initial fetch (no existing requests)
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] })
      })
      // Mock submit request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ request: { id: '1', status: 'pending' } })
      })
      // Mock refresh after submit
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          requests: [{ 
            id: '1', 
            reason: 'Test reason', 
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            reviewed_at: null
          }] 
        })
      });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Reason for Admin Access/);
    const submitButton = screen.getByRole('button', { name: 'Submit Request' });

    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Test reason' })
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Test reason')).toBeInTheDocument();
    });
  });

  it('shows error for empty reason', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [] })
    });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
    });

    const form = screen.getByTestId('admin-request-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please provide a reason for your admin request')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock initial fetch (no existing requests)
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] })
      })
      // Mock failed submit
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Reason for Admin Access/);
    const submitButton = screen.getByRole('button', { name: 'Submit Request' });

    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('disables submit button when submitting', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] })
      })
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AdminRequestForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Reason for Admin Access/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Reason for Admin Access/);
    const submitButton = screen.getByRole('button', { name: 'Submit Request' });

    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});