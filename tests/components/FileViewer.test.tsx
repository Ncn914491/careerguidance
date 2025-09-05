/**
 * Tests for FileViewer component - PDF viewing and download functionality
 * Tests all file types and error handling scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileViewer from '../../src/components/ui/FileViewer';

// Mock document methods for download functionality
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild
});

describe('FileViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock link element
    const mockLink = {
      href: '',
      download: '',
      target: '',
      click: mockClick
    };
    
    mockCreateElement.mockReturnValue(mockLink);
  });

  describe('PDF File Viewing', () => {
    const pdfFile = {
      id: 'pdf-1',
      file_name: 'career-guide.pdf',
      file_type: 'pdf' as const,
      file_url: 'https://storage.supabase.co/week-files/career-guide.pdf',
      file_size: 1048576
    };

    it('should render PDF viewer with inline iframe', () => {
      render(<FileViewer file={pdfFile} />);
      
      expect(screen.getByText('career-guide.pdf')).toBeInTheDocument();
      expect(screen.getByText('pdf • 1 MB')).toBeInTheDocument();
      
      // Check for PDF iframe
      const iframe = screen.getByTitle('career-guide.pdf');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://storage.supabase.co/week-files/career-guide.pdf#toolbar=1&navpanes=1&scrollbar=1');
    });

    it('should display PDF download button', () => {
      render(<FileViewer file={pdfFile} />);
      
      const downloadButtons = screen.getAllByText('Download');
      expect(downloadButtons.length).toBeGreaterThan(0);
      
      // Check for download icon
      const downloadIcons = screen.getAllByRole('button');
      const downloadButton = downloadIcons.find(button => 
        button.textContent?.includes('Download') || button.getAttribute('title') === 'Download file'
      );
      expect(downloadButton).toBeInTheDocument();
    });

    it('should handle PDF download functionality', () => {
      render(<FileViewer file={pdfFile} />);
      
      const downloadButton = screen.getAllByText('Download')[0];
      fireEvent.click(downloadButton);
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should format PDF file size correctly', () => {
      const testCases = [
        { size: 1024, expected: '1 KB' },
        { size: 1048576, expected: '1 MB' },
        { size: 1073741824, expected: '1 GB' },
        { size: 512, expected: '512 Bytes' },
        { size: null, expected: 'Unknown size' }
      ];

      testCases.forEach(({ size, expected }) => {
        const testFile = { ...pdfFile, file_size: size };
        const { rerender } = render(<FileViewer file={testFile} />);
        
        expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
        
        rerender(<div />); // Clear for next test
      });
    });

    it('should display PDF with proper toolbar parameters', () => {
      render(<FileViewer file={pdfFile} />);
      
      const iframe = screen.getByTitle('career-guide.pdf');
      const src = iframe.getAttribute('src');
      
      expect(src).toContain('#toolbar=1');
      expect(src).toContain('navpanes=1');
      expect(src).toContain('scrollbar=1');
    });
  });

  describe('Photo File Viewing', () => {
    const photoFile = {
      id: 'photo-1',
      file_name: 'school-visit.jpg',
      file_type: 'photo' as const,
      file_url: 'https://storage.supabase.co/week-files/school-visit.jpg',
      file_size: 2097152
    };

    it('should render photo with proper attributes', () => {
      render(<FileViewer file={photoFile} />);
      
      expect(screen.getByText('school-visit.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo • 2 MB')).toBeInTheDocument();
      
      const image = screen.getByAltText('school-visit.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', photoFile.file_url);
    });

    it('should handle image load errors', async () => {
      render(<FileViewer file={photoFile} />);
      
      const image = screen.getByAltText('school-visit.jpg');
      
      // Simulate image load error
      fireEvent.error(image);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      });
    });

    it('should provide download functionality for photos', () => {
      render(<FileViewer file={photoFile} />);
      
      const downloadButton = screen.getByTitle('Download file');
      fireEvent.click(downloadButton);
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Video File Viewing', () => {
    const videoFile = {
      id: 'video-1',
      file_name: 'presentation.mp4',
      file_type: 'video' as const,
      file_url: 'https://storage.supabase.co/week-files/presentation.mp4',
      file_size: 52428800
    };

    it('should render video player with controls', () => {
      render(<FileViewer file={videoFile} />);
      
      expect(screen.getByText('presentation.mp4')).toBeInTheDocument();
      expect(screen.getByText('video • 50 MB')).toBeInTheDocument();
      
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('controls');
    });

    it('should include multiple video source formats', () => {
      render(<FileViewer file={videoFile} />);
      
      const sources = document.querySelectorAll('source');
      expect(sources.length).toBe(3);
      
      const sourceTypes = Array.from(sources).map(source => source.getAttribute('type'));
      expect(sourceTypes).toContain('video/mp4');
      expect(sourceTypes).toContain('video/webm');
      expect(sourceTypes).toContain('video/ogg');
    });

    it('should handle video load errors', async () => {
      render(<FileViewer file={videoFile} />);
      
      const video = document.querySelector('video');
      
      // Simulate video load error
      fireEvent.error(video!);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      });
    });

    it('should provide download functionality for videos', () => {
      render(<FileViewer file={videoFile} />);
      
      const downloadButton = screen.getByTitle('Download file');
      fireEvent.click(downloadButton);
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Unsupported File Types', () => {
    it('should handle unsupported file types gracefully', () => {
      const unsupportedFile = {
        id: 'unsupported-1',
        file_name: 'document.txt',
        file_type: 'text' as any,
        file_url: 'https://storage.supabase.co/week-files/document.txt',
        file_size: 1024
      };

      render(<FileViewer file={unsupportedFile} />);
      
      expect(screen.getByText('document.txt')).toBeInTheDocument();
      expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should create download link with correct attributes', () => {
      const testFile = {
        id: 'test-1',
        file_name: 'test-file.pdf',
        file_type: 'pdf' as const,
        file_url: 'https://storage.supabase.co/week-files/test-file.pdf',
        file_size: 1024
      };

      render(<FileViewer file={testFile} />);
      
      const downloadButton = screen.getAllByText('Download')[0];
      fireEvent.click(downloadButton);
      
      // Verify link creation and attributes
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      
      const mockLink = mockCreateElement.mock.results[0].value;
      expect(mockLink.href).toBe(testFile.file_url);
      expect(mockLink.download).toBe(testFile.file_name);
      expect(mockLink.target).toBe('_blank');
    });

    it('should handle download for different file types', () => {
      const fileTypes = [
        { type: 'pdf', name: 'document.pdf' },
        { type: 'photo', name: 'image.jpg' },
        { type: 'video', name: 'video.mp4' }
      ];

      fileTypes.forEach(({ type, name }) => {
        const testFile = {
          id: `test-${type}`,
          file_name: name,
          file_type: type as any,
          file_url: `https://storage.supabase.co/week-files/${name}`,
          file_size: 1024
        };

        const { unmount } = render(<FileViewer file={testFile} />);
        
        const downloadButton = screen.getByTitle('Download file');
        fireEvent.click(downloadButton);
        
        expect(mockClick).toHaveBeenCalled();
        
        unmount();
        jest.clearAllMocks();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly across different units', () => {
      const testCases = [
        { size: 0, expected: '0 Bytes' },
        { size: 500, expected: '500 Bytes' },
        { size: 1024, expected: '1 KB' },
        { size: 1536, expected: '1.5 KB' },
        { size: 1048576, expected: '1 MB' },
        { size: 1572864, expected: '1.5 MB' },
        { size: 1073741824, expected: '1 GB' },
        { size: 1610612736, expected: '1.5 GB' }
      ];

      testCases.forEach(({ size, expected }) => {
        const testFile = {
          id: 'size-test',
          file_name: 'test.pdf',
          file_type: 'pdf' as const,
          file_url: 'https://example.com/test.pdf',
          file_size: size
        };

        const { rerender } = render(<FileViewer file={testFile} />);
        
        expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
        
        rerender(<div />);
      });
    });

    it('should handle null file size', () => {
      const testFile = {
        id: 'null-size',
        file_name: 'test.pdf',
        file_type: 'pdf' as const,
        file_url: 'https://example.com/test.pdf',
        file_size: null
      };

      render(<FileViewer file={testFile} />);
      
      expect(screen.getByText('pdf • Unknown size')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and titles', () => {
      const pdfFile = {
        id: 'accessibility-test',
        file_name: 'accessible-document.pdf',
        file_type: 'pdf' as const,
        file_url: 'https://storage.supabase.co/week-files/accessible-document.pdf',
        file_size: 1024
      };

      render(<FileViewer file={pdfFile} />);
      
      // Check iframe title
      const iframe = screen.getByTitle('accessible-document.pdf');
      expect(iframe).toBeInTheDocument();
      
      // Check download button title
      const downloadButton = screen.getByTitle('Download file');
      expect(downloadButton).toBeInTheDocument();
    });

    it('should have proper alt text for images', () => {
      const photoFile = {
        id: 'alt-test',
        file_name: 'test-image.jpg',
        file_type: 'photo' as const,
        file_url: 'https://storage.supabase.co/week-files/test-image.jpg',
        file_size: 1024
      };

      render(<FileViewer file={photoFile} />);
      
      const image = screen.getByAltText('test-image.jpg');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file properties gracefully', () => {
      const incompleteFile = {
        id: 'incomplete',
        file_name: 'test.pdf',
        file_type: 'pdf' as const,
        file_url: 'https://example.com/test.pdf',
        file_size: undefined as any
      };

      expect(() => {
        render(<FileViewer file={incompleteFile} />);
      }).not.toThrow();
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrlFile = {
        id: 'invalid-url',
        file_name: 'test.pdf',
        file_type: 'pdf' as const,
        file_url: 'invalid-url',
        file_size: 1024
      };

      expect(() => {
        render(<FileViewer file={invalidUrlFile} />);
      }).not.toThrow();
    });
  });
});