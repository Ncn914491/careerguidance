import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../../src/app/admin/page';

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('AdminPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders admin upload form', () => {
    render(<AdminPage />);
    
    expect(screen.getByText('Admin Panel - Upload Week Content')).toBeInTheDocument();
    expect(screen.getByLabelText(/Week Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByText('Click to upload files or drag and drop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Week Content/ })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<AdminPage />);
    
    const submitButton = screen.getByRole('button', { name: /Upload Week Content/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Week number is required/)).toBeInTheDocument();
    });
  });

  it('validates file requirements', async () => {
    render(<AdminPage />);
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/Week Number/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Week' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /Upload Week Content/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/At least one photo is required/)).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    render(<AdminPage />);
    
    // Create mock files
    const photoFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/Week Number/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Week' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test description' } });

    // Upload files
    const fileInput = screen.getByLabelText(/Files/);
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile, pdfFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Check files are displayed
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Check file summary
    expect(screen.getByText('Photos: 1')).toBeInTheDocument();
    expect(screen.getByText('PDFs: 1')).toBeInTheDocument();
  });

  it('removes files when delete button is clicked', async () => {
    render(<AdminPage />);
    
    const photoFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    
    const fileInput = screen.getByLabelText(/Files/);
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Week uploaded successfully!' }),
    });

    render(<AdminPage />);
    
    const photoFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Week Number/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Week' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test description' } });

    const fileInput = screen.getByLabelText(/Files/);
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile, pdfFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Upload Week Content/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Week uploaded successfully!')).toBeInTheDocument();
    });

    // Check form is reset
    expect((screen.getByLabelText(/Week Number/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Title/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Description/) as HTMLTextAreaElement).value).toBe('');
  });

  it('handles upload errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    });

    render(<AdminPage />);
    
    const photoFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Week Number/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Week' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test description' } });

    const fileInput = screen.getByLabelText(/Files/);
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile, pdfFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Upload Week Content/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });
});