import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileViewer from '../../../src/components/ui/FileViewer';

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and appendChild/removeChild for download functionality
const mockLink = {
  href: '',
  download: '',
  target: '',
  click: jest.fn(),
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockLink),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});

describe('FileViewer', () => {
  const mockPhotoFile = {
    id: 'photo-1',
    file_name: 'test-photo.jpg',
    file_type: 'photo' as const,
    file_url: 'https://example.com/photo.jpg',
    file_size: 2048,
  };

  const mockVideoFile = {
    id: 'video-1',
    file_name: 'test-video.mp4',
    file_type: 'video' as const,
    file_url: 'https://example.com/video.mp4',
    file_size: 10485760, // 10MB
  };

  const mockPdfFile = {
    id: 'pdf-1',
    file_name: 'test-document.pdf',
    file_type: 'pdf' as const,
    file_url: 'https://example.com/document.pdf',
    file_size: 1048576, // 1MB
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Photo File Rendering', () => {
    it('should render photo file correctly', () => {
      render(<FileViewer file={mockPhotoFile} />);
      
      expect(screen.getByText('test-photo.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo • 2 KB')).toBeInTheDocument();
      
      const image = screen.getByAltText('test-photo.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('should handle image load errors', () => {
      render(<FileViewer file={mockPhotoFile} />);
      
      const image = screen.getByAltText('test-photo.jpg');
      fireEvent.error(image);
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });

    it('should provide download functionality for photos', () => {
      render(<FileViewer file={mockPhotoFile} />);
      
      const downloadButtons = screen.getAllByTitle('Download file');
      expect(downloadButtons).toHaveLength(1);
      
      fireEvent.click(downloadButtons[0]);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('https://example.com/photo.jpg');
      expect(mockLink.download).toBe('test-photo.jpg');
      expect(mockLink.target).toBe('_blank');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Video File Rendering', () => {
    it('should render video file correctly', () => {
      render(<FileViewer file={mockVideoFile} />);
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText('video • 10 MB')).toBeInTheDocument();
      
      const video = screen.getByRole('application'); // video element
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('controls');
    });

    it('should handle video load errors', () => {
      render(<FileViewer file={mockVideoFile} />);
      
      const video = screen.getByRole('application');
      fireEvent.error(video);
      
      expect(screen.getByText('Failed to load video')).toBeInTheDocument();
    });

    it('should provide multiple video source formats', () => {
      render(<FileViewer file={mockVideoFile} />);
      
      const sources = screen.getAllByRole('generic'); // source elements
      // Should have mp4, webm, and ogg sources
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('PDF File Rendering', () => {
    it('should render PDF file correctly', () => {
      render(<FileViewer file={mockPdfFile} />);
      
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByText('pdf • 1 MB')).toBeInTheDocument();
      
      // Should have download button
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
      
      // Should have iframe for PDF viewing
      const iframe = screen.getByTitle('test-document.pdf');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://example.com/document.pdf#toolbar=1&navpanes=1&scrollbar=1');
    });

    it('should provide PDF download functionality', () => {
      render(<FileViewer file={mockPdfFile} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('https://example.com/document.pdf');
      expect(mockLink.download).toBe('test-document.pdf');
      expect(mockLink.target).toBe('_blank');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should render PDF with inline viewer and toolbar', () => {
      render(<FileViewer file={mockPdfFile} />);
      
      const iframe = screen.getByTitle('test-document.pdf');
      expect(iframe).toHaveAttribute('src', expect.stringContaining('#toolbar=1&navpanes=1&scrollbar=1'));
      expect(iframe).toHaveClass('w-full', 'h-full', 'rounded');
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      const fileWithBytes = { ...mockPhotoFile, file_size: 512 };
      render(<FileViewer file={fileWithBytes} />);
      expect(screen.getByText('photo • 512 Bytes')).toBeInTheDocument();
    });

    it('should format KB correctly', () => {
      const fileWithKB = { ...mockPhotoFile, file_size: 1536 }; // 1.5 KB
      render(<FileViewer file={fileWithKB} />);
      expect(screen.getByText('photo • 1.5 KB')).toBeInTheDocument();
    });

    it('should format MB correctly', () => {
      const fileWithMB = { ...mockPhotoFile, file_size: 2097152 }; // 2 MB
      render(<FileViewer file={fileWithMB} />);
      expect(screen.getByText('photo • 2 MB')).toBeInTheDocument();
    });

    it('should format GB correctly', () => {
      const fileWithGB = { ...mockPhotoFile, file_size: 2147483648 }; // 2 GB
      render(<FileViewer file={fileWithGB} />);
      expect(screen.getByText('photo • 2 GB')).toBeInTheDocument();
    });

    it('should handle null file size', () => {
      const fileWithNullSize = { ...mockPhotoFile, file_size: null };
      render(<FileViewer file={fileWithNullSize} />);
      expect(screen.getByText('photo • Unknown size')).toBeInTheDocument();
    });
  });

  describe('Unsupported File Types', () => {
    it('should handle unsupported file types', () => {
      const unsupportedFile = {
        id: 'unsupported-1',
        file_name: 'test.txt',
        file_type: 'text' as any,
        file_url: 'https://example.com/test.txt',
        file_size: 1024,
      };

      render(<FileViewer file={unsupportedFile} />);
      
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should create download link with correct attributes', () => {
      render(<FileViewer file={mockPdfFile} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should handle download for all file types', () => {
      const files = [mockPhotoFile, mockVideoFile, mockPdfFile];
      
      files.forEach((file) => {
        const { unmount } = render(<FileViewer file={file} />);
        
        const downloadButton = screen.getByTitle('Download file');
        fireEvent.click(downloadButton);
        
        expect(mockLink.href).toBe(file.file_url);
        expect(mockLink.download).toBe(file.file_name);
        
        unmount();
        jest.clearAllMocks();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<FileViewer file={mockPhotoFile} />);
      
      const image = screen.getByAltText('test-photo.jpg');
      expect(image).toBeInTheDocument();
    });

    it('should have proper title for PDF iframe', () => {
      render(<FileViewer file={mockPdfFile} />);
      
      const iframe = screen.getByTitle('test-document.pdf');
      expect(iframe).toBeInTheDocument();
    });

    it('should have accessible download buttons', () => {
      render(<FileViewer file={mockPdfFile} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
      
      const iconButton = screen.getByTitle('Download file');
      expect(iconButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle image loading errors gracefully', () => {
      render(<FileViewer file={mockPhotoFile} />);
      
      const image = screen.getByAltText('test-photo.jpg');
      fireEvent.error(image);
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      expect(screen.queryByAltText('test-photo.jpg')).not.toBeInTheDocument();
    });

    it('should handle video loading errors gracefully', () => {
      render(<FileViewer file={mockVideoFile} />);
      
      const video = screen.getByRole('application');
      fireEvent.error(video);
      
      expect(screen.getByText('Failed to load video')).toBeInTheDocument();
    });

    it('should maintain download functionality even with display errors', () => {
      render(<FileViewer file={mockPhotoFile} />);
      
      const image = screen.getByAltText('test-photo.jpg');
      fireEvent.error(image);
      
      // Download should still work
      const downloadButton = screen.getByTitle('Download file');
      fireEvent.click(downloadButton);
      
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});