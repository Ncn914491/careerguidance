import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeksPage from '../../src/components/features/WeeksPage/WeeksPage';

// Mock fetch
global.fetch = jest.fn();

// Mock Modal component
jest.mock('../../src/components/ui/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        <div>{children}</div>
      </div>
    );
  };
});

// Mock FileViewer component
jest.mock('../../src/components/ui/FileViewer', () => {
  return function MockFileViewer({ file }) {
    return (
      <div data-testid="file-viewer">
        <div>{file.file_name}</div>
        <div>{file.file_type}</div>
      </div>
    );
  };
});

const mockWeeksData = {
  weeks: [
    {
      id: '1',
      week_number: 1,
      title: 'Introduction to Career Guidance',
      description: 'Overview of career opportunities',
      created_at: '2024-01-01T00:00:00Z',
      week_files: [
        {
          id: 'f1',
          file_name: 'intro.pdf',
          file_type: 'pdf',
          file_url: 'https://example.com/intro.pdf',
          file_size: 1024,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'f2',
          file_name: 'photo1.jpg',
          file_type: 'photo',
          file_url: 'https://example.com/photo1.jpg',
          file_size: 2048,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
    },
    {
      id: '2',
      week_number: 2,
      title: 'Computer Science Fundamentals',
      description: 'Basic programming concepts',
      created_at: '2024-01-08T00:00:00Z',
      week_files: []
    }
  ]
};

describe('WeeksPage', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<WeeksPage />);
    
    expect(screen.getByText('Weeks')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('renders weeks after successful fetch', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Career Guidance')).toBeInTheDocument();
      expect(screen.getByText('Computer Science Fundamentals')).toBeInTheDocument();
    });
  });

  it('displays file counts for each week', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('2 files')).toBeInTheDocument();
      expect(screen.getByText('0 files')).toBeInTheDocument();
    });
  });

  it('opens modal when week is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 1'));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Week 1: Introduction to Career Guidance');
  });

  it('displays files in modal', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 1'));

    expect(screen.getByTestId('file-viewer')).toBeInTheDocument();
    expect(screen.getByText('intro.pdf')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch weeks' })
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch weeks')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no weeks available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ weeks: [] })
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('No weeks available yet.')).toBeInTheDocument();
    });
  });

  it('navigates between files in modal', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 1'));

    // Should show first file initially
    expect(screen.getByText('intro.pdf')).toBeInTheDocument();

    // Click on second file tab
    fireEvent.click(screen.getByText('photo1.jpg'));

    // Should now show second file
    expect(screen.getByText('photo')).toBeInTheDocument();
  });

  it('displays file navigation arrows when multiple files exist', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 1'));

    // Should show navigation arrows
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('handles file navigation with arrow buttons', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 1'));

    // Initially on first file
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    
    // Previous button should be disabled
    const prevButton = screen.getByText('Previous').closest('button');
    expect(prevButton).toBeDisabled();

    // Click next button
    const nextButton = screen.getByText('Next').closest('button');
    fireEvent.click(nextButton);

    // Should now be on second file
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    
    // Next button should now be disabled
    expect(nextButton).toBeDisabled();
    
    // Previous button should be enabled
    expect(prevButton).not.toBeDisabled();
  });

  it('displays correct file type icons and counts', async () => {
    const weekWithMixedFiles = {
      weeks: [
        {
          id: '1',
          week_number: 1,
          title: 'Mixed Files Week',
          description: 'Week with various file types',
          created_at: '2024-01-01T00:00:00Z',
          week_files: [
            {
              id: 'f1',
              file_name: 'document.pdf',
              file_type: 'pdf',
              file_url: 'https://example.com/document.pdf',
              file_size: 1024,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 'f2',
              file_name: 'photo1.jpg',
              file_type: 'photo',
              file_url: 'https://example.com/photo1.jpg',
              file_size: 2048,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 'f3',
              file_name: 'photo2.jpg',
              file_type: 'photo',
              file_url: 'https://example.com/photo2.jpg',
              file_size: 2048,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 'f4',
              file_name: 'video.mp4',
              file_type: 'video',
              file_url: 'https://example.com/video.mp4',
              file_size: 10485760,
              created_at: '2024-01-01T00:00:00Z'
            }
          ]
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => weekWithMixedFiles
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    // Should display file type counts
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 photos
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 video and 1 pdf
    expect(screen.getByText('4 files')).toBeInTheDocument(); // Total files
  });

  it('handles weeks with no files', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 2'));

    // Should show no files message
    expect(screen.getByText('No files available for this week.')).toBeInTheDocument();
  });

  it('displays formatted dates correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument();
      expect(screen.getByText('January 8, 2024')).toBeInTheDocument();
    });
  });

  it('handles modal close functionality', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Week 1'));

    // Modal should be open
    expect(screen.getByTestId('modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId('modal-close'));

    // Modal should be closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('resets file index when opening different week', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    // Open first week and navigate to second file
    fireEvent.click(screen.getByText('Week 1'));
    const nextButton = screen.getByText('Next').closest('button');
    fireEvent.click(nextButton);
    expect(screen.getByText('2 of 2')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId('modal-close'));

    // Open second week (which has no files)
    fireEvent.click(screen.getByText('Week 2'));

    // Should show no files message (not trying to show file index 2)
    expect(screen.getByText('No files available for this week.')).toBeInTheDocument();
  });

  it('handles network errors during fetch', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('retries fetch when try again button is clicked', async () => {
    // First call fails
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Second call succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeeksData
    });

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
    });
  });
});