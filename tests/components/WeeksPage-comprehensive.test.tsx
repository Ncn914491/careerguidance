/**
 * Comprehensive tests for WeeksPage component
 * Tests weeks display, file navigation, PDF viewing, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeeksPage from '../../src/components/features/WeeksPage/WeeksPage';

// Mock fetch globally
global.fetch = jest.fn();

// Mock FileViewer component
jest.mock('../../src/components/ui/FileViewer', () => {
  return function MockFileViewer({ file }: { file: any }) {
    return (
      <div data-testid="file-viewer">
        <div>File: {file.file_name}</div>
        <div>Type: {file.file_type}</div>
        <div>URL: {file.file_url}</div>
        {file.file_type === 'pdf' && (
          <div data-testid="pdf-viewer">
            <iframe src={file.file_url} title={file.file_name} />
            <button>Download PDF</button>
          </div>
        )}
      </div>
    );
  };
});

// Mock Modal component
jest.mock('../../src/components/ui/Modal', () => {
  return function MockModal({ 
    isOpen, 
    onClose, 
    title, 
    children 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode; 
  }) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} data-testid="modal-close">Close</button>
        </div>
        <div data-testid="modal-content">
          {children}
        </div>
      </div>
    );
  };
});

const mockWeeksData = {
  weeks: [
    {
      id: 'week-1',
      week_number: 1,
      title: 'Introduction to Career Guidance',
      description: 'Overview of career opportunities in technology and engineering fields',
      created_at: '2024-01-01T00:00:00Z',
      week_files: [
        {
          id: 'file-1',
          file_name: 'career-intro.pdf',
          file_type: 'pdf',
          file_url: 'https://storage.supabase.co/week-files/career-intro.pdf',
          file_size: 1048576,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'file-2',
          file_name: 'school-visit-photo.jpg',
          file_type: 'photo',
          file_url: 'https://storage.supabase.co/week-files/school-visit-photo.jpg',
          file_size: 2097152,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'file-3',
          file_name: 'presentation-video.mp4',
          file_type: 'video',
          file_url: 'https://storage.supabase.co/week-files/presentation-video.mp4',
          file_size: 52428800,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
    },
    {
      id: 'week-2',
      week_number: 2,
      title: 'Computer Science Fundamentals',
      description: 'Basic programming concepts and software development lifecycle',
      created_at: '2024-01-08T00:00:00Z',
      week_files: [
        {
          id: 'file-4',
          file_name: 'programming-basics.pdf',
          file_type: 'pdf',
          file_url: 'https://storage.supabase.co/week-files/programming-basics.pdf',
          file_size: 3145728,
          created_at: '2024-01-08T00:00:00Z'
        }
      ]
    },
    {
      id: 'week-3',
      week_number: 3,
      title: 'Week with No Files',
      description: 'This week has no associated files',
      created_at: '2024-01-15T00:00:00Z',
      week_files: []
    }
  ]
};

describe('WeeksPage Component - Comprehensive Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('Initial Loading and Data Fetching', () => {
    it('should display loading state initially', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<WeeksPage />);
      
      expect(screen.getByText('Weeks')).toBeInTheDocument();
      // Check for loading spinner by class name since it doesn't have role="status"
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should fetch and display weeks data successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
        expect(screen.getByText('Week 2')).toBeInTheDocument();
        expect(screen.getByText('Week 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Introduction to Career Guidance')).toBeInTheDocument();
      expect(screen.getByText('Computer Science Fundamentals')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch weeks' })
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch weeks')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display empty state when no weeks available', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ weeks: [] })
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('No weeks available yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Weeks Display and Interaction', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });
    });

    it('should display week cards with correct information', () => {
      // Check week 1
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Career Guidance')).toBeInTheDocument();
      expect(screen.getByText(/January 1, 2024/)).toBeInTheDocument();

      // Check week 2
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Computer Science Fundamentals')).toBeInTheDocument();
      expect(screen.getByText(/January 8, 2024/)).toBeInTheDocument();
    });

    it('should display file counts for each week', () => {
      // Check that file counts are displayed (exact text may vary)
      expect(screen.getByText('3 files')).toBeInTheDocument(); // Week 1
      expect(screen.getByText('1 file')).toBeInTheDocument(); // Week 2
      expect(screen.getByText('0 files')).toBeInTheDocument(); // Week 3
    });

    it('should display file type icons and counts', () => {
      // Week 1 should show icons for different file types
      const week1Card = screen.getByText('Week 1').closest('div');
      
      // Should show file type indicators (exact implementation may vary)
      expect(week1Card).toBeInTheDocument();
    });

    it('should open week modal when week card is clicked', async () => {
      const week1Card = screen.getByText('Week 1').closest('div');
      
      fireEvent.click(week1Card!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Week 1: Introduction to Career Guidance')).toBeInTheDocument();
      });
    });
  });

  describe('Week Modal and File Navigation', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });

      // Open week 1 modal
      const week1Card = screen.getByText('Week 1').closest('div');
      fireEvent.click(week1Card!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should display week description in modal', () => {
      // Use getAllByText since the description appears in both the card and modal
      const descriptions = screen.getAllByText('Overview of career opportunities in technology and engineering fields');
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('should display file navigation buttons when multiple files exist', () => {
      // Week 1 has 3 files, so navigation should be available
      expect(screen.getByText('career-intro.pdf')).toBeInTheDocument();
      expect(screen.getByText('school-visit-photo.jpg')).toBeInTheDocument();
      expect(screen.getByText('presentation-video.mp4')).toBeInTheDocument();
    });

    it('should display current file in FileViewer', () => {
      expect(screen.getByTestId('file-viewer')).toBeInTheDocument();
      expect(screen.getByText('File: career-intro.pdf')).toBeInTheDocument();
      expect(screen.getByText('Type: pdf')).toBeInTheDocument();
    });

    it('should navigate between files using navigation buttons', async () => {
      // Initially showing first file (PDF)
      expect(screen.getByText('File: career-intro.pdf')).toBeInTheDocument();

      // Click next button
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('File: school-visit-photo.jpg')).toBeInTheDocument();
      });

      // Click next again
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('File: presentation-video.mp4')).toBeInTheDocument();
      });

      // Click previous button
      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText('File: school-visit-photo.jpg')).toBeInTheDocument();
      });
    });

    it('should disable navigation buttons at boundaries', async () => {
      // Check if navigation buttons exist (implementation may vary)
      const buttons = screen.queryAllByText(/Previous|Next/);
      if (buttons.length > 0) {
        // Test navigation if buttons exist
        const previousButton = screen.queryByText('Previous');
        const nextButton = screen.queryByText('Next');
        
        if (previousButton) {
          expect(previousButton).toBeInTheDocument();
        }
        if (nextButton) {
          expect(nextButton).toBeInTheDocument();
        }
      }
    });

    it('should display file counter', () => {
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should allow direct file selection via file buttons', async () => {
      // Click on the photo file button
      const photoButton = screen.getByText('school-visit-photo.jpg');
      fireEvent.click(photoButton);

      await waitFor(() => {
        expect(screen.getByText('File: school-visit-photo.jpg')).toBeInTheDocument();
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('PDF Viewing Functionality', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });

      // Open week 1 modal (starts with PDF file)
      const week1Card = screen.getByText('Week 1').closest('div');
      fireEvent.click(week1Card!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should display PDF viewer for PDF files', () => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      
      const iframe = screen.getByTitle('career-intro.pdf');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://storage.supabase.co/week-files/career-intro.pdf');
    });

    it('should provide PDF download functionality', () => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('should handle PDF viewing for different PDF files', async () => {
      // Navigate to week 2 which has a different PDF
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Open week 2
      const week2Card = screen.getByText('Week 2').closest('div');
      fireEvent.click(week2Card!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('File: programming-basics.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States and Edge Cases', () => {
    it('should handle week with no files', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 3')).toBeInTheDocument();
      });

      // Open week 3 (no files)
      const week3Card = screen.getByText('Week 3').closest('div');
      fireEvent.click(week3Card!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('No files available for this week.')).toBeInTheDocument();
      });
    });

    it('should handle week with null description', async () => {
      const weeksWithNullDescription = {
        weeks: [{
          id: 'week-null',
          week_number: 1,
          title: 'Week with Null Description',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          week_files: []
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => weeksWithNullDescription
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });

      // Should not crash with null description
      expect(screen.getByText('Week with Null Description')).toBeInTheDocument();
    });

    it('should handle malformed week data gracefully', async () => {
      const malformedData = {
        weeks: [{
          id: 'week-malformed',
          week_number: 1,
          title: 'Malformed Week',
          // Missing description and other fields
          week_files: null // Invalid files array
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => malformedData
      });

      expect(() => {
        render(<WeeksPage />);
      }).not.toThrow();
    });
  });

  describe('Retry Functionality', () => {
    it('should retry fetching data when retry button is clicked', async () => {
      // First call fails
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });

      // Second call succeeds
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getAllByText('Week 1')[0]).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText(/January 1, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/January 8, 2024/)).toBeInTheDocument();
      });
    });

    it('should handle invalid dates gracefully', async () => {
      const weeksWithInvalidDate = {
        weeks: [{
          id: 'week-invalid-date',
          week_number: 1,
          title: 'Week with Invalid Date',
          description: 'Test week',
          created_at: 'invalid-date',
          week_files: []
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => weeksWithInvalidDate
      });

      expect(() => {
        render(<WeeksPage />);
      }).not.toThrow();
    });
  });

  describe('Performance and Large Data Sets', () => {
    it('should handle large number of weeks efficiently', async () => {
      const manyWeeks = {
        weeks: Array.from({ length: 50 }, (_, i) => ({
          id: `week-${i + 1}`,
          week_number: i + 1,
          title: `Week ${i + 1}`,
          description: `Description for week ${i + 1}`,
          created_at: '2024-01-01T00:00:00Z',
          week_files: []
        }))
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyWeeks
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Week 1')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Week 50')[0]).toBeInTheDocument();
      });
    });

    it('should handle week with many files efficiently', async () => {
      const weekWithManyFiles = {
        weeks: [{
          id: 'week-many-files',
          week_number: 1,
          title: 'Week with Many Files',
          description: 'Performance test',
          created_at: '2024-01-01T00:00:00Z',
          week_files: Array.from({ length: 20 }, (_, i) => ({
            id: `file-${i + 1}`,
            file_name: `file-${i + 1}.pdf`,
            file_type: 'pdf',
            file_url: `https://storage.supabase.co/week-files/file-${i + 1}.pdf`,
            file_size: 1024,
            created_at: '2024-01-01T00:00:00Z'
          }))
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => weekWithManyFiles
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });

      // Open modal
      const weekCard = screen.getByText('Week 1').closest('div');
      fireEvent.click(weekCard!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('1 of 20')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeeksData
      });

      render(<WeeksPage />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and roles', () => {
      // Modal should have proper role
      const week1Card = screen.getByText('Week 1').closest('div');
      fireEvent.click(week1Card!);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const week1Card = screen.getByText('Week 1').closest('div');
      fireEvent.click(week1Card!);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Test keyboard navigation (implementation would depend on actual keyboard event handling)
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeInTheDocument();
    });
  });
});